import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SOURCES_PATH = path.join(ROOT, "data", "sources.json");
const NEWS_PATH = path.join(ROOT, "data", "news.json");
const HEALTH_PATH = path.join(ROOT, "data", "health.json");
const STRICT = process.argv.includes("--strict") || process.env.HEALTH_STRICT === "1";

function hoursSince(iso) {
  if (!iso) return Infinity;
  return (Date.now() - new Date(iso).getTime()) / 3600000;
}

export async function buildHealth() {
  const sources = JSON.parse(await fs.readFile(SOURCES_PATH, "utf-8"));
  const news = JSON.parse(await fs.readFile(NEWS_PATH, "utf-8"));
  const issues = [];
  const warnings = [];
  const categoryReports = [];

  for (const source of sources.categories) {
    const bucket = news.categories?.[source.id];
    const articles = bucket?.articles ?? [];
    const withImages = articles.filter((a) => a.image).length;
    const newest = articles
      .map((a) => a.publishedAt)
      .filter(Boolean)
      .sort()
      .at(-1);
    const fetchAge = hoursSince(bucket?.lastFetchAt);
    const articleAge = hoursSince(newest);
    const overdue = fetchAge > source.intervalHours * 2.5;

    const report = {
      id: source.id,
      name: source.name,
      source: source.source,
      articles: articles.length,
      expected: source.topCount,
      withImages,
      lastFetchAt: bucket?.lastFetchAt ?? null,
      newestArticleAt: newest ?? null,
      fetchAgeHours: Number(fetchAge.toFixed(1)),
      articleAgeHours: Number(articleAge.toFixed(1)),
      overdue,
      empty: articles.length === 0,
    };

    if (report.empty) {
      issues.push(`${source.name}: 0 новостей`);
    } else if (articles.length < source.topCount) {
      warnings.push(`${source.name}: ${articles.length}/${source.topCount} новостей`);
    }
    if (overdue) {
      issues.push(`${source.name}: сбор просрочен на ${report.fetchAgeHours} ч`);
    }
    if (articleAge > 24 * 14) {
      warnings.push(`${source.name}: свежайшая новость старше 14 дней`);
    }
    if (articles.length > 0 && withImages === 0) {
      warnings.push(`${source.name}: нет картинок`);
    }

    categoryReports.push(report);
  }

  const totalArticles = categoryReports.reduce((sum, c) => sum + c.articles, 0);
  const totalImages = categoryReports.reduce((sum, c) => sum + c.withImages, 0);
  const emptyCount = categoryReports.filter((c) => c.empty).length;
  const overdueCount = categoryReports.filter((c) => c.overdue).length;
  const expected = sources.categories.reduce((sum, s) => sum + s.topCount, 0);

  if (totalArticles < expected * 0.5) {
    issues.push(`Мало материалов: ${totalArticles}/${expected}`);
  }
  if (emptyCount >= 5) {
    issues.push(`Пустых категорий: ${emptyCount}`);
  }
  if (overdueCount >= 8) {
    issues.push(`Просроченных категорий: ${overdueCount}`);
  }
  if (totalArticles > 0 && totalImages / totalArticles < 0.4) {
    issues.push(`Мало картинок: ${totalImages}/${totalArticles}`);
  }

  const ok = issues.length === 0;
  const health = {
    checkedAt: new Date().toISOString(),
    ok,
    status: ok ? (warnings.length ? "warn" : "ok") : "fail",
    issues,
    warnings,
    stats: {
      categories: sources.categories.length,
      articles: totalArticles,
      expected,
      withImages: totalImages,
      emptyCategories: emptyCount,
      overdueCategories: overdueCount,
      newsUpdatedAt: news.updatedAt ?? null,
    },
    categories: categoryReports,
  };

  await fs.writeFile(HEALTH_PATH, JSON.stringify(health, null, 2), "utf-8");
  return health;
}

function printReport(health) {
  console.log(`Health: ${health.status.toUpperCase()} · ${health.stats.articles}/${health.stats.expected} новостей · фото ${health.stats.withImages}`);
  for (const issue of health.issues) console.error(`✗ ${issue}`);
  for (const warning of health.warnings) console.warn(`! ${warning}`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  buildHealth()
    .then((health) => {
      printReport(health);
      if (process.env.GITHUB_STEP_SUMMARY) {
        const lines = [
          `## Диагностика сбора`,
          `Статус: **${health.status}**`,
          `Новостей: ${health.stats.articles}/${health.stats.expected}, с фото: ${health.stats.withImages}`,
          health.issues.length ? `Проблемы:\n${health.issues.map((i) => `- ${i}`).join("\n")}` : "",
          health.warnings.length ? `Предупреждения:\n${health.warnings.map((i) => `- ${i}`).join("\n")}` : "",
        ].filter(Boolean);
        return fs.appendFile(process.env.GITHUB_STEP_SUMMARY, `${lines.join("\n")}\n`);
      }
      return health;
    })
    .then((health) => {
      if (STRICT && health && health.issues?.length) process.exit(1);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
