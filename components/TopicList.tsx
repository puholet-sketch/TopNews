import Link from "next/link";
import { NewsImage } from "@/components/NewsImage";
import type { NewsArticle } from "@/lib/types";
import { formatRelative, getCategoryColor, imageFallback } from "@/lib/news";

export function TopicList({ articles }: { articles: NewsArticle[] }) {
  return (
    <div className="topic-list">
      {articles.map((article) => {
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
              <NewsImage
                src={article.image}
                fallback={imageFallback(article.id + article.title)}
                alt=""
              />
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
