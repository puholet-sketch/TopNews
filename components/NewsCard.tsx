import Link from "next/link";
import type { NewsArticle } from "@/lib/types";
import { formatRelative, imageFallback } from "@/lib/news";

interface NewsCardProps {
  article: NewsArticle;
  variant?: "lead" | "side" | "card";
}

export function NewsCard({ article, variant = "card" }: NewsCardProps) {
  const src = article.image || imageFallback(article.id + article.title);
  const isLead = variant === "lead";

  return (
    <article className={`story ${isLead ? "lead" : ""}`}>
      <Link
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`story-media ${isLead ? "lead" : ""}`}
        aria-label={article.title}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" loading="lazy" decoding="async" />
      </Link>
      <div className="story-body">
        <div className="story-meta">
          <Link href={`/category/${article.categorySlug}`} className="story-cat">
            {article.categoryName}
          </Link>
          <span>{article.source}</span>
        </div>
        <h3 className="story-title">
          <Link href={article.url} target="_blank" rel="noopener noreferrer">
            {article.title}
          </Link>
        </h3>
        {article.summary && variant !== "side" && (
          <p className="story-summary">{article.summary}</p>
        )}
        <time className="story-time" dateTime={article.publishedAt}>
          {formatRelative(article.publishedAt)}
        </time>
      </div>
    </article>
  );
}
