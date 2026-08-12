import Link from "next/link";
import type { SourceCategory } from "@/lib/types";
import { getCategoryColor } from "@/lib/news";

export function CategoryGrid({ categories }: { categories: SourceCategory[] }) {
  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <h2>Все темы</h2>
        </div>
        <div className="topics-index">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="topic-chip"
              style={{ "--cat-accent": getCategoryColor(cat.slug) } as React.CSSProperties}
            >
              <strong>{cat.name}</strong>
              <span>
                {cat.source} · каждые {cat.intervalHours} ч
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
