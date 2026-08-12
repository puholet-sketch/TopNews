import newsData from "@/data/news.json";
import sourcesData from "@/data/sources.json";
import type { CategoryNews, NewsArticle, NewsData, SourceCategory } from "./types";

export function getNewsData(): NewsData {
  return newsData as NewsData;
}

export function getSources(): SourceCategory[] {
  return sourcesData.categories as SourceCategory[];
}

export function getAllArticles(): NewsArticle[] {
  const data = getNewsData();
  return Object.values(data.categories)
    .flatMap((category) => category.articles)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
}

export function getArticlesByCategory(slug: string): NewsArticle[] {
  const data = getNewsData();
  const category = Object.values(data.categories).find((c) => c.slug === slug);
  return category?.articles ?? [];
}

export function getCategoryBySlug(slug: string) {
  return getSources().find((c) => c.slug === slug);
}

export function getCategoryBuckets(): Array<{
  category: SourceCategory;
  articles: NewsArticle[];
  meta?: CategoryNews;
}> {
  const data = getNewsData();
  return getSources()
    .map((category) => ({
      category,
      articles: data.categories[category.id]?.articles ?? [],
      meta: data.categories[category.id],
    }))
    .filter((bucket) => bucket.articles.length > 0);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export function formatRelative(dateStr: string): string {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} дн назад`;
  return formatDate(dateStr);
}

const CATEGORY_COLORS: Record<string, string> = {
  it: "#2563eb",
  ai: "#7c3aed",
  cybersecurity: "#dc2626",
  business: "#059669",
  startups: "#d97706",
  science: "#0891b2",
  medicine: "#e11d48",
  health: "#db2777",
  environment: "#16a34a",
  energy: "#ca8a04",
  space: "#4338ca",
  automotive: "#475569",
  gaming: "#9333ea",
  entertainment: "#f97316",
  sports: "#0284c7",
  politics: "#991b1b",
  education: "#0d9488",
  law: "#57534e",
  realestate: "#854d0e",
  travel: "#0369a1",
};

export function getCategoryColor(slug: string): string {
  return CATEGORY_COLORS[slug] || "#0b5fff";
}

export function getFreshnessLabel(updatedAt: string | null): string {
  if (!updatedAt) return "данные не загружены";
  const hours = (Date.now() - new Date(updatedAt).getTime()) / 3600000;
  if (hours < 3) return "обновлено недавно";
  if (hours < 12) return "данные актуальны";
  return "требуется обновление";
}

export function imageFallback(seed: string): string {
  const palette = ["1a365d", "234e52", "744210", "553c9a", "9b2c2c", "276749"];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const color = palette[hash % palette.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#${color}"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="675" fill="url(#g)"/>
    <circle cx="980" cy="120" r="180" fill="rgba(255,255,255,0.06)"/>
    <circle cx="160" cy="540" r="220" fill="rgba(255,255,255,0.05)"/>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
