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
  lastRunAt?: string | null;
  totalCategories: number;
  fetchedNow?: string[];
  skippedNow?: string[];
  failedNow?: Array<{ id: string; error: string }>;
  categories: Record<string, CategoryNews>;
}

export interface HealthReport {
  checkedAt: string;
  ok: boolean;
  status: "ok" | "warn" | "fail";
  issues: string[];
  warnings: string[];
  stats: {
    categories: number;
    articles: number;
    expected: number;
    withImages: number;
    emptyCategories: number;
    overdueCategories: number;
    newsUpdatedAt: string | null;
  };
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
  keywordFilter?: string[];
  fallbackFeedUrl?: string;
  fallbackKeywordFilter?: string[];
}
