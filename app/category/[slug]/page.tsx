import { notFound } from "next/navigation";
import { NewsCard } from "@/components/NewsCard";
import {
  getArticlesByCategory,
  getCategoryBySlug,
  getSources,
} from "@/lib/news";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getSources().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return { title: "TopNews" };
  return {
    title: `${category.name} — TopNews`,
    description: `Топ-5 новостей из ${category.source}`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const articles = getArticlesByCategory(slug);

  return (
    <section style={{ padding: "3rem 0" }}>
      <div className="container">
        <p style={{ color: "var(--accent)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>
          {category.source}
        </p>
        <h1 className="serif" style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
          {category.name}
        </h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
          Топ-{category.topCount} · обновление каждые {category.intervalHours} ч
        </p>

        {articles.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>Новости ещё не собраны для этой темы.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {articles.map((a) => (
              <NewsCard key={a.id} article={a} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
