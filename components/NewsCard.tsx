import Link from "next/link";
import type { NewsArticle } from "@/lib/types";
import { formatDate } from "@/lib/news";

interface NewsCardProps {
  article: NewsArticle;
  featured?: boolean;
}

export function NewsCard({ article, featured = false }: NewsCardProps) {
  return (
    <article
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gridColumn: featured ? "span 2" : undefined,
        transition: "transform 0.2s, border-color 0.2s",
      }}
    >
      <Link href={article.url} target="_blank" rel="noopener noreferrer">
        <div
          style={{
            aspectRatio: featured ? "21/9" : "16/10",
            background: article.image
              ? `url(${article.image}) center/cover`
              : "linear-gradient(135deg, var(--accent-soft), var(--bg-elevated))",
            position: "relative",
          }}
        >
          {!article.image && (
            <span
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                color: "var(--text-muted)",
                fontSize: "0.85rem",
              }}
            >
              {article.categoryName}
            </span>
          )}
        </div>
      </Link>
      <div style={{ padding: "1.25rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <Link
            href={`/category/${article.categorySlug}`}
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--accent)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {article.categoryName}
          </Link>
          <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
            {article.source}
          </span>
        </div>
        <h3
          className={featured ? "serif" : undefined}
          style={{
            fontSize: featured ? "1.75rem" : "1.05rem",
            lineHeight: 1.3,
            fontWeight: featured ? 400 : 600,
          }}
        >
          <Link href={article.url} target="_blank" rel="noopener noreferrer">
            {article.title}
          </Link>
        </h3>
        {article.summary && (
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", flex: 1 }}>
            {article.summary}
          </p>
        )}
        <time style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
          {formatDate(article.publishedAt)}
        </time>
      </div>
    </article>
  );
}
