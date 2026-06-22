import Link from "next/link";
import type { SourceCategory } from "@/lib/types";

interface CategoryGridProps {
  categories: SourceCategory[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <section style={{ padding: "3rem 0" }}>
      <div className="container">
        <h2 className="serif" style={{ fontSize: "2rem", marginBottom: "1.5rem" }}>
          Все темы
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "0.75rem",
          }}
        >
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              style={{
                padding: "1rem 1.25rem",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "0.35rem",
                transition: "border-color 0.2s, background 0.2s",
              }}
            >
              <span style={{ fontWeight: 600 }}>{cat.name}</span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {cat.source} · каждые {cat.intervalHours}ч
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
