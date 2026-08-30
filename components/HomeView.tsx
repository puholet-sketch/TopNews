"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CategoryGrid } from "@/components/CategoryGrid";
import { NewsCard } from "@/components/NewsCard";
import { TopicList } from "@/components/TopicList";
import { formatRelative, getCategoryColor } from "@/lib/news";
import type { NewsArticle, SourceCategory } from "@/lib/types";

interface HomeViewProps {
  articles: NewsArticle[];
  sources: SourceCategory[];
  updatedAt: string | null;
  buckets: Array<{ category: SourceCategory; articles: NewsArticle[] }>;
}

export function HomeView({ articles, sources, updatedAt, buckets }: HomeViewProps) {
  const [panel, setPanel] = useState<"materials" | "topics" | null>(null);
  const [topicSlug, setTopicSlug] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const selected = sources.find((source) => source.slug === topicSlug) || null;
  const visible = useMemo(
    () => (topicSlug ? articles.filter((article) => article.categorySlug === topicSlug) : articles),
    [articles, topicSlug]
  );
  const searched = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return articles.slice(0, 40);
    return articles
      .filter((article) =>
        `${article.title} ${article.categoryName} ${article.source}`.toLowerCase().includes(needle)
      )
      .slice(0, 40);
  }, [articles, query]);

  const lead = visible[0];
  const side = visible.slice(1, 4);
  const latest = visible.slice(4, 13);
  const topicBuckets = topicSlug
    ? buckets.filter((bucket) => bucket.category.slug === topicSlug)
    : buckets.slice(0, 8);

  function pickTopic(slug: string) {
    setTopicSlug(slug);
    setPanel(null);
  }

  return (
    <>
      <section className="hero">
        <div className="container">
          <p className="hero-kicker">Автоагрегатор · {sources.length} тем</p>
          <h1>Свежие новости на русском</h1>
          <p className="hero-lead">
            Топ материалов по каждой теме — IT, экология, футбол России, лыжи, MMA и ещё{" "}
            {Math.max(sources.length - 5, 0)} направлений. Сбор каждые 2–24 часа.
          </p>
          <div className="hero-meta" role="toolbar" aria-label="Выбор ленты">
            <button
              type="button"
              className={`meta-pill interactive ${panel === "materials" ? "is-open" : ""}`}
              aria-expanded={panel === "materials"}
              aria-controls="explore-panel"
              onClick={() => setPanel((value) => (value === "materials" ? null : "materials"))}
            >
              <span>{articles.length} материалов</span>
              <span className="pill-chevron" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`meta-pill interactive ${panel === "topics" || topicSlug ? "is-open" : ""}`}
              aria-expanded={panel === "topics"}
              aria-controls="explore-panel"
              onClick={() => setPanel((value) => (value === "topics" ? null : "topics"))}
            >
              <span>
                {selected ? selected.name : `${sources.length} тем`}
              </span>
              <span className="pill-chevron" aria-hidden="true" />
            </button>
            {dataUpdated(updatedAt)}
          </div>

          {selected && (
            <div className="active-filter">
              <span>Сейчас: {selected.name}</span>
              <button type="button" onClick={() => setTopicSlug(null)}>
                все темы
              </button>
            </div>
          )}

          {panel && (
            <div id="explore-panel" className="explore-panel" role="dialog" aria-label="Выбор">
              {panel === "materials" ? (
                <>
                  <div className="explore-head">
                    <strong>Выбрать материал</strong>
                    <button type="button" className="explore-close" onClick={() => setPanel(null)}>
                      закрыть
                    </button>
                  </div>
                  <input
                    className="explore-search"
                    type="search"
                    placeholder="Найти новость или источник"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  <div className="explore-list">
                    {searched.map((article) => (
                      <a
                        key={article.id}
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="explore-item"
                      >
                        <span
                          className="explore-dot"
                          style={{ background: getCategoryColor(article.categorySlug) }}
                        />
                        <span>
                          <strong>{article.title}</strong>
                          <em>
                            {article.categoryName} · {article.source} ·{" "}
                            {formatRelative(article.publishedAt)}
                          </em>
                        </span>
                      </a>
                    ))}
                    {searched.length === 0 && <p className="explore-empty">Ничего не нашлось</p>}
                  </div>
                </>
              ) : (
                <>
                  <div className="explore-head">
                    <strong>Выбрать тему</strong>
                    <button type="button" className="explore-close" onClick={() => setPanel(null)}>
                      закрыть
                    </button>
                  </div>
                  <div className="explore-topics">
                    <button
                      type="button"
                      className={`explore-topic ${!topicSlug ? "active" : ""}`}
                      onClick={() => {
                        setTopicSlug(null);
                        setPanel(null);
                      }}
                    >
                      Все темы
                    </button>
                    {sources.map((source) => (
                      <button
                        key={source.id}
                        type="button"
                        className={`explore-topic ${topicSlug === source.slug ? "active" : ""}`}
                        style={{ "--cat-accent": getCategoryColor(source.slug) } as React.CSSProperties}
                        onClick={() => pickTopic(source.slug)}
                      >
                        {source.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {visible.length === 0 ? (
        <section className="section">
          <div className="container">
            <div className="empty-state">
              <p className="serif" style={{ fontSize: "1.6rem", marginBottom: "0.5rem" }}>
                {topicSlug ? "В этой теме пока пусто" : "Новостей пока нет"}
              </p>
              <p style={{ color: "var(--ink-muted)" }}>
                {topicSlug
                  ? "Выберите другую тему или дождитесь следующего сбора."
                  : "Запустите сбор или дождитесь GitHub Actions."}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <>
          {lead && (
            <section className="section" id="feed">
              <div className="container">
                <div className="section-head">
                  <h2>{selected ? selected.name : "Главное сейчас"}</h2>
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
          )}

          {latest.length > 0 && (
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
          )}

          {topicBuckets.map(({ category, articles: topicArticles }) => (
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

function dataUpdated(updatedAt: string | null) {
  if (!updatedAt) return null;
  return (
    <span className="meta-pill quiet">
      обновлено {new Date(updatedAt).toLocaleString("ru-RU")}
    </span>
  );
}
