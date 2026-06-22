export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  image: string | null;
  publishedAt: string;
  source: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
}

export interface CategoryNews {
  lastFetchAt: string;
  intervalHours: number;
  source: string;
  siteUrl: string;
  name: string;
  slug: string;
  articles: NewsArticle[];
}

export interface NewsData {
  updatedAt: string | null;
  totalCategories: number;
  categories: Record<string, CategoryNews>;
}

export interface SourceCategory {
  id: string;
  name: string;
  slug: string;
  source: string;
  siteUrl: string;
  feedUrl: string;
  intervalHours: number;
  topCount: number;
}
