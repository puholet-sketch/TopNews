import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import Parser from "rss-parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SOURCES_PATH = path.join(ROOT, "data", "sources.json");
const NEWS_PATH = path.join(ROOT, "data", "news.json");
const FORCE = process.argv.includes("--force") || process.env.FORCE_REFRESH === "1";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "application/rss+xml, application/xml, text/xml, */*",
  "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.5",
};

const parser = new Parser({
  requestOptions: { headers: HEADERS, timeout: 45000 },
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: true }],
      ["media:group", "mediaGroup"],
      ["enclosure", "enclosure", { keepArray: true }],
      ["content:encoded", "contentEncoded"],
      ["yandex:full-text", "yandexFullText"],
      ["itunes:image", "itunesImage"],
    ],
  },
});

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function pickUrl(candidate) {
  if (!candidate) return null;
  if (typeof candidate === "string") return candidate.startsWith("http") ? candidate : null;
  if (candidate.url) return candidate.url;
  if (candidate.$?.url) return candidate.$.url;
  if (candidate.$?.href) return candidate.$.href;
  return null;
}

function extractImage(item) {
  const pageUrl = item.link || "";
  for (const enc of asArray(item.enclosure)) {
    const url = normalizeImage(pickUrl(enc), pageUrl);
    const type = enc?.type || enc?.$?.type || "";
    if (url && (!type || type.startsWith("image") || /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(url))) {
      return url;
    }
  }

  for (const media of asArray(item.mediaContent)) {
    const url = normalizeImage(pickUrl(media), pageUrl);
    if (url) return url;
  }

  for (const thumb of asArray(item.mediaThumbnail)) {
    const url = normalizeImage(pickUrl(thumb), pageUrl);
    if (url) return url;
  }

  if (item.itunesImage) {
    const url = normalizeImage(pickUrl(item.itunesImage) || item.itunesImage?.href, pageUrl);
    if (url) return url;
  }

  const html = [
    item.contentEncoded,
    item["content:encoded"],
    item.content,
    item.summary,
    item.description,
    item.yandexFullText,
  ]
    .filter(Boolean)
    .join(" ");

  const patterns = [
    /<img[^>]+src=["']([^"']+)["']/i,
    /<media:content[^>]+url=["']([^"']+)["']/i,
    /og:image["'\s]+content=["']([^"']+)["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return normalizeImage(match[1], pageUrl);
  }

  return null;
}

function stripHtml(html = "") {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
}

function itemHaystack(item) {
  return `${item.title || ""} ${item.contentSnippet || ""} ${item.summary || ""} ${item.content || ""}`.toLowerCase();
}

function matchesKeywords(item, keywords, excludeKeywords) {
  const haystack = itemHaystack(item);
  if (excludeKeywords?.some((kw) => haystack.includes(kw.toLowerCase()))) return false;
  if (!keywords?.length) return true;
  return keywords.some((kw) => haystack.includes(kw.toLowerCase()));
}

function normalizeImage(url, pageUrl) {
  if (!url) return null;
  let image = String(url)
    .replace(/&#0*38;/g, "&")
    .replace(/&amp;/g, "&")
    .trim();
  if (image.startsWith("//")) image = `https:${image}`;
  if (image.startsWith("/") && pageUrl) {
    try {
      return new URL(image, pageUrl).toString();
    } catch {
      return null;
    }
  }
  return image.startsWith("http") ? image : null;
}

function shouldFetch(category, existing) {
  if (FORCE) return true;
  const lastFetch = existing?.lastFetchAt;
  if (!lastFetch) return true;
  const elapsed = Date.now() - new Date(lastFetch).getTime();
  return elapsed >= category.intervalHours * 60 * 60 * 1000;
}

async function fetchOgImage(url) {
  if (!url || !url.startsWith("http")) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      headers: {
        ...HEADERS,
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    if (!res.ok) return null;
    const html = await res.text();
    const patterns = [
      /property=["']og:image:secure_url["'][^>]*content=["']([^"']+)["']/i,
      /property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
      /content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
      /name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
      /content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i,
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        const image = match[1].replace(/&#0*38;/g, "&").replace(/&amp;/g, "&").trim();
        return normalizeImage(image, url);
      }
    }
  } catch {
    /* ignore */
  } finally {
    clearTimeout(timer);
  }
  return null;
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const current = index++;
      results[current] = await mapper(items[current], current);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function loadFeedItems(feedUrl) {
  const feed = await parser.parseURL(feedUrl);
  return feed.items || [];
}

function itemTime(item) {
  const raw = item.isoDate || item.pubDate;
  const time = raw ? Date.parse(raw) : NaN;
  return Number.isFinite(time) ? time : 0;
}

function normalizeFeeds(category) {
  if (category.feeds?.length) {
    return category.feeds.map((feed) => ({
      url: feed.url,
      source: feed.source || category.source,
      keywordFilter: feed.keywordFilter,
      excludeKeywords: feed.excludeKeywords || category.excludeKeywords,
    }));
  }

  return [category.feedUrl, category.fallbackFeedUrl].filter(Boolean).map((url, index) => ({
    url,
    source: index > 0 ? `${category.source} (резерв)` : category.source,
    keywordFilter:
      index > 0 ? category.fallbackKeywordFilter || category.keywordFilter : category.keywordFilter,
    excludeKeywords: category.excludeKeywords,
  }));
}

async function toArticles(category, rows) {
  return mapWithConcurrency(rows, 3, async (row, index) => {
    const item = row.item;
    let image = extractImage(item);
    if (!image && item.link) {
      image = await fetchOgImage(item.link);
    }

    return {
      id: `${category.id}-${index}-${itemTime(item) || Date.now()}`,
      title: (item.title || "Без заголовка").trim(),
      summary: stripHtml(item.contentSnippet || item.summary || item.contentEncoded || ""),
      url: item.link || category.siteUrl,
      image,
      publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
      source: row.source,
      categoryId: category.id,
      categoryName: category.name,
      categorySlug: category.slug,
    };
  });
}

async function loadFeedRows(feed) {
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      let items = await loadFeedItems(feed.url);
      items = items.filter((item) =>
        matchesKeywords(item, feed.keywordFilter, feed.excludeKeywords)
      );
      return items.map((item) => ({ item, source: feed.source, feedUrl: feed.url }));
    } catch (error) {
      lastError = error;
      await new Promise((r) => setTimeout(r, 1200 * attempt));
    }
  }
  throw lastError;
}

function dedupeRows(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = canonicalUrl(row.item.link || "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchCategory(category) {
  const feeds = normalizeFeeds(category);
  if (!feeds.length) throw new Error("нет RSS-источников");

  if (category.feeds?.length) {
    const collected = [];
    let lastError;
    for (const feed of feeds) {
      try {
        const rows = await loadFeedRows(feed);
        collected.push(...rows);
      } catch (error) {
        lastError = error;
        console.warn(`  ↺ ${category.name}: ${feed.source} недоступен`);
      }
    }
    if (!collected.length) throw lastError || new Error("все ленты недоступны");

    let rows = collected.filter((row) =>
      matchesKeywords(row.item, category.keywordFilter, category.excludeKeywords)
    );
    rows = dedupeRows(rows);
    rows.sort((a, b) => {
      if (category.preferRussian) {
        const ru = (row) => (/[а-яё]/i.test(row.item.title || "") ? 1 : 0);
        const diff = ru(b) - ru(a);
        if (diff) return diff;
      }
      return itemTime(b.item) - itemTime(a.item);
    });
    rows = rows.slice(0, category.topCount);
    return toArticles(category, rows);
  }

  let lastError;
  for (let urlIndex = 0; urlIndex < feeds.length; urlIndex++) {
    const feed = feeds[urlIndex];
    try {
      let rows = await loadFeedRows(feed);
      rows = rows.slice(0, category.topCount);
      return toArticles(category, rows);
    } catch (error) {
      lastError = error;
      if (urlIndex < feeds.length - 1) {
        console.warn(`  ↺ ${category.name}: основной RSS недоступен, пробую резерв`);
      }
    }
  }

  throw lastError;
}

function canonicalUrl(url = "") {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    for (const key of [...parsed.searchParams.keys()]) {
      if (key.toLowerCase().startsWith("utm_")) parsed.searchParams.delete(key);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function categoryFeedUrls(source) {
  if (source.feeds?.length) return source.feeds.map((feed) => feed.url).filter(Boolean);
  return [source.feedUrl].filter(Boolean);
}

function dedupeAcrossCategories(results, sourceList) {
  const byFeed = new Map();
  for (const source of sourceList) {
    for (const key of categoryFeedUrls(source)) {
      if (!byFeed.has(key)) byFeed.set(key, []);
      byFeed.get(key).push(source);
    }
  }

  for (const group of byFeed.values()) {
    if (group.length < 2) continue;
    const seen = new Set();
    const ordered = [...group].sort((a, b) => {
      const score = (c) => (c.id === "politics" ? 2 : c.keywordFilter?.length ? 0 : 1);
      return score(a) - score(b);
    });

    for (const source of ordered) {
      const bucket = results[source.id];
      if (!bucket?.articles) continue;
      bucket.articles = bucket.articles.filter((article) => {
        const key = canonicalUrl(article.url);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
  }
}

async function main() {
  const sources = JSON.parse(await fs.readFile(SOURCES_PATH, "utf-8"));
  let existing = { updatedAt: null, categories: {} };
  try {
    existing = JSON.parse(await fs.readFile(NEWS_PATH, "utf-8"));
  } catch {
    /* first run */
  }

  const results = FORCE ? {} : { ...existing.categories };
  const fetched = [];
  const skipped = [];
  const failed = [];
  const dueCount = sources.categories.filter((category) =>
    shouldFetch(category, existing.categories?.[category.id])
  ).length;

  for (const category of sources.categories) {
    if (!shouldFetch(category, existing.categories?.[category.id])) {
      skipped.push(category.id);
      continue;
    }

    try {
      const articles = await fetchCategory(category);
      const withImages = articles.filter((a) => a.image).length;
      results[category.id] = {
        lastFetchAt: new Date().toISOString(),
        intervalHours: category.intervalHours,
        source: category.source,
        siteUrl: category.siteUrl,
        name: category.name,
        slug: category.slug,
        articles,
      };
      fetched.push(category.id);
      console.log(`✓ ${category.name}: ${articles.length} новостей (${withImages} с фото)`);
    } catch (error) {
      failed.push({ id: category.id, error: error.message });
      console.error(`✗ ${category.name}: ${error.message}`);
    }
  }

  const changed = fetched.length > 0;
  dedupeAcrossCategories(results, sources.categories);
  const output = {
    updatedAt: changed ? new Date().toISOString() : existing.updatedAt,
    lastRunAt: new Date().toISOString(),
    totalCategories: sources.categories.length,
    fetchedNow: fetched,
    skippedNow: skipped,
    failedNow: failed,
    categories: results,
  };

  await fs.writeFile(NEWS_PATH, JSON.stringify(output, null, 2), "utf-8");
  console.log(
    `\nГотово. Обновлено: ${fetched.length}, пропущено: ${skipped.length}, ошибок: ${failed.length}${FORCE ? " (force)" : ""}`
  );

  if (dueCount > 0 && fetched.length === 0 && failed.length === dueCount) {
    console.error("Критично: все категории, которые пора было обновить, упали.");
    process.exit(1);
  }
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
