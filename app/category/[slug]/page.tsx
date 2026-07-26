import Link from "next/link";
import { notFound } from "next/navigation";
import { NewsCard } from "@/components/NewsCard";
import { TopicList } from "@/components/TopicList";
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
    title: category.name,
    description: `Топ-${category.topCount} новостей: ${category.name} · ${category.source}`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const articles = getArticlesByCategory(slug);
  const lead = articles[0];
  const rest = articles.slice(1);

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Хлебные крошки">
            <Link href="/">Главная</Link>
            <span>/</span>
            <span>{category.name}</span>
          </nav>
          <p className="source">{category.source}</p>
          <h1>{category.name}</h1>
          <p>
            Топ-{category.topCount} · обновление каждые {category.intervalHours} ч
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {articles.length === 0 ? (
            <div className="empty-state">
              <p>Новости ещё не собраны для этой темы.</p>
            </div>
          ) : (
            <div className="topic-layout">
              {lead && <NewsCard article={lead} variant="lead" />}
              {rest.length > 0 ? (
                <TopicList articles={rest} />
              ) : (
                <div className="cards-grid" style={{ gridTemplateColumns: "1fr" }}>
                  {/* placeholder spacing when only one article */}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {articles.length > 1 && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <h2>Все материалы темы</h2>
            </div>
            <div className="cards-grid">
              {articles.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
