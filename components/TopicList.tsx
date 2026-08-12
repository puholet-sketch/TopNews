import Link from "next/link";
import type { NewsArticle } from "@/lib/types";
import { formatRelative, getCategoryColor, imageFallback } from "@/lib/news";

export function TopicList({ articles }: { articles: NewsArticle[] }) {
  return (
    <div className="topic-list">
      {articles.map((article) => {
        const src = article.image || imageFallback(article.id + article.title);
        const accent = getCategoryColor(article.categorySlug);
        return (
          <Link
            key={article.id}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="topic-item"
            style={{ "--cat-accent": accent } as React.CSSProperties}
          >
            <div className="topic-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" decoding="async" />
            </div>
            <div>
              <h3>{article.title}</h3>
              <p>
                {article.source} · {formatRelative(article.publishedAt)}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
