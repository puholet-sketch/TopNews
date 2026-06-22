import newsData from "@/data/news.json";
import sourcesData from "@/data/sources.json";
import type { NewsArticle, NewsData, SourceCategory } from "./types";

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

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}
