import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import Parser from "rss-parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SOURCES_PATH = path.join(ROOT, "data", "sources.json");
const NEWS_PATH = path.join(ROOT, "data", "news.json");

const parser = new Parser({
  requestOptions: {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; TopNewsBot/1.0; +https://puholet-sketch.github.io/TopNews/)",
      Accept: "application/rss+xml, application/xml, text/xml, */*",
      "Accept-Language": "ru-RU,ru;q=0.9",
    },
    timeout: 30000,
  },
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: true }],
      ["enclosure", "enclosure"],
    ],
  },
});

function extractImage(item) {
  if (item.enclosure?.url && item.enclosure.type?.startsWith("image")) {
    return item.enclosure.url;
  }

  if (item.mediaContent?.[0]?.$?.url) {
    return item.mediaContent[0].$.url;
  }

  if (item.mediaThumbnail?.[0]?.$?.url) {
    return item.mediaThumbnail[0].$.url;
  }

  const html = item.content || item["content:encoded"] || item.summary || "";
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) {
    return imgMatch[1].replace(/&amp;/g, "&");
  }

  return null;
}

function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}

function shouldFetch(category, existing) {
  const lastFetch = existing?.lastFetchAt;
  if (!lastFetch) return true;

  const elapsed = Date.now() - new Date(lastFetch).getTime();
  const intervalMs = category.intervalHours * 60 * 60 * 1000;
  return elapsed >= intervalMs;
}

async function fetchCategory(category) {
  const feed = await parser.parseURL(category.feedUrl);
  const items = (feed.items || []).slice(0, category.topCount);

  return items.map((item, index) => ({
    id: `${category.id}-${index}-${Date.parse(item.isoDate || item.pubDate || "") || Date.now()}`,
    title: item.title?.trim() || "Без заголовка",
    summary: stripHtml(item.contentSnippet || item.summary || ""),
    url: item.link || category.siteUrl,
    image: extractImage(item),
    publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
    source: category.source,
    categoryId: category.id,
    categoryName: category.name,
    categorySlug: category.slug,
  }));
}

async function main() {
  const sources = JSON.parse(await fs.readFile(SOURCES_PATH, "utf-8"));
  let existing = { updatedAt: null, categories: {} };

  try {
    existing = JSON.parse(await fs.readFile(NEWS_PATH, "utf-8"));
  } catch {
    /* first run */
  }

  const results = { ...existing.categories };
  const fetched = [];
  const skipped = [];

  for (const category of sources.categories) {
    if (!shouldFetch(category, existing.categories?.[category.id])) {
      skipped.push(category.id);
      continue;
    }

    try {
      const articles = await fetchCategory(category);
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
      console.log(`✓ ${category.name}: ${articles.length} новостей`);
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
  console.log(`\nГотово. Обновлено: ${fetched.length}, пропущено: ${skipped.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
