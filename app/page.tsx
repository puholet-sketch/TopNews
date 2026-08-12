import Link from "next/link";
import { CategoryGrid } from "@/components/CategoryGrid";
import { NewsCard } from "@/components/NewsCard";
import { TopicList } from "@/components/TopicList";
import {
  getAllArticles,
  getCategoryBuckets,
  getNewsData,
  getSources,
} from "@/lib/news";

export default function HomePage() {
  const articles = getAllArticles();
  const sources = getSources();
  const data = getNewsData();
  const buckets = getCategoryBuckets().slice(0, 8);
  const lead = articles[0];
  const side = articles.slice(1, 4);
  const latest = articles.slice(4, 13);

  return (
    <>
      <section className="hero">
        <div className="container">
          <p className="hero-kicker">Автоагрегатор · 20 тем</p>
          <h1>Свежие новости на русском</h1>
          <p className="hero-lead">
            Топ-5 материалов по каждой теме — IT, медицина, наука, спорт и ещё 16
            направлений. Сбор каждые 2–12 часов, публикация автоматически.
          </p>
          <div className="hero-meta">
            <span className="meta-pill">{articles.length} материалов</span>
            <span className="meta-pill">{sources.length} тем</span>
            {data.updatedAt && (
              <span className="meta-pill">
                обновлено {new Date(data.updatedAt).toLocaleString("ru-RU")}
              </span>
            )}
          </div>
        </div>
      </section>

      {articles.length === 0 ? (
        <section className="section">
          <div className="container">
            <div className="empty-state">
              <p className="serif" style={{ fontSize: "1.6rem", marginBottom: "0.5rem" }}>
                Новостей пока нет
              </p>
              <p style={{ color: "var(--ink-muted)" }}>
                Запустите <code>npm run collect -- --force</code> или дождитесь
                GitHub Actions.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="section">
            <div className="container">
              <div className="section-head">
                <h2>Главное сейчас</h2>
                <Link href={`/category/${lead.categorySlug}`} className="section-link">
                  Смотреть тему →
                </Link>
              </div>
              <div className="lead-grid">
                <NewsCard article={lead} variant="lead" />
                <div className="side-stack">
                  {side.map((article) => (
                    <NewsCard key={article.id} article={article} variant="side" />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="section">
            <div className="container">
              <div className="section-head">
                <h2>Свежая лента</h2>
              </div>
              <div className="cards-grid">
                {latest.map((article) => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            </div>
          </section>

          {buckets.map(({ category, articles: topicArticles }) => (
            <section key={category.id} className="topic-block">
              <div className="container">
                <div className="section-head">
                  <h2>{category.name}</h2>
                  <Link href={`/category/${category.slug}`} className="section-link">
                    Все {topicArticles.length} →
                  </Link>
                </div>
                <div className="topic-layout">
                  <NewsCard article={topicArticles[0]} variant="lead" />
                  <TopicList articles={topicArticles.slice(1, 5)} />
                </div>
              </div>
            </section>
          ))}
        </>
      )}

      <CategoryGrid categories={sources} />
    </>
  );
}
