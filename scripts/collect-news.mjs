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
  requestOptions: { headers: HEADERS, timeout: 25000 },
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
  for (const enc of asArray(item.enclosure)) {
    const url = pickUrl(enc);
    const type = enc?.type || enc?.$?.type || "";
    if (url && (!type || type.startsWith("image") || /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(url))) {
      return url;
    }
  }

  for (const media of asArray(item.mediaContent)) {
    const url = pickUrl(media);
    if (url) return url;
  }

  for (const thumb of asArray(item.mediaThumbnail)) {
    const url = pickUrl(thumb);
    if (url) return url;
  }

  if (item.itunesImage) {
    const url = pickUrl(item.itunesImage) || item.itunesImage?.href;
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
    if (match?.[1]) return match[1].replace(/&amp;/g, "&");
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

function matchesKeywords(item, keywords) {
  if (!keywords?.length) return true;
  const haystack = `${item.title || ""} ${item.contentSnippet || ""} ${item.summary || ""}`.toLowerCase();
  return keywords.some((kw) => haystack.includes(kw.toLowerCase()));
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
        const image = match[1].replace(/&amp;/g, "&").trim();
        if (image.startsWith("http")) return image;
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

async function fetchCategory(category) {
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const feed = await parser.parseURL(category.feedUrl);
      let items = feed.items || [];

      if (category.keywordFilter?.length) {
        const filtered = items.filter((item) =>
          matchesKeywords(item, category.keywordFilter)
        );
        items = filtered.length > 0 ? filtered : items;
      }

      items = items.slice(0, category.topCount);

      return mapWithConcurrency(items, 3, async (item, index) => {
        let image = extractImage(item);
        if (!image && item.link) {
          image = await fetchOgImage(item.link);
        }

        return {
          id: `${category.id}-${index}-${Date.parse(item.isoDate || item.pubDate || "") || Date.now()}`,
          title: (item.title || "Без заголовка").trim(),
          summary: stripHtml(
            item.contentSnippet || item.summary || item.contentEncoded || ""
          ),
          url: item.link || category.siteUrl,
          image,
          publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
          source: category.source,
          categoryId: category.id,
          categoryName: category.name,
          categorySlug: category.slug,
        };
      });
    } catch (error) {
      lastError = error;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  throw lastError;
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
      console.error(`✗ ${category.name}: ${error.message}`);
    }
  }

  const output = {
    updatedAt: new Date().toISOString(),
    totalCategories: sources.categories.length,
    fetchedNow: fetched,
    skippedNow: skipped,
    categories: results,
  };

  await fs.writeFile(NEWS_PATH, JSON.stringify(output, null, 2), "utf-8");
  console.log(`\nГотово. Обновлено: ${fetched.length}, пропущено: ${skipped.length}${FORCE ? " (force)" : ""}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
