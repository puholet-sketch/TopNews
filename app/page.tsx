import { CategoryGrid } from "@/components/CategoryGrid";
import { NewsCard } from "@/components/NewsCard";
import { getAllArticles, getNewsData, getSources } from "@/lib/news";

export default function HomePage() {
  const articles = getAllArticles();
  const sources = getSources();
  const data = getNewsData();
  const featured = articles.slice(0, 1);
  const rest = articles.slice(1, 13);

  return (
    <>
      <section
        style={{
          padding: "4rem 0 2rem",
          background:
            "radial-gradient(ellipse 80% 60% at 50% -20%, var(--accent-soft), transparent)",
        }}
      >
        <div className="container">
          <p
            style={{
              color: "var(--accent)",
              fontWeight: 600,
              fontSize: "0.85rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "1rem",
            }}
          >
            Автоагрегатор новостей
          </p>
          <h1
            className="serif"
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4rem)",
              lineHeight: 1.1,
              maxWidth: "16ch",
              marginBottom: "1rem",
            }}
          >
            Топ-5 из 20 ведущих источников
          </h1>
          <p style={{ color: "var(--text-muted)", maxWidth: "52ch", fontSize: "1.1rem" }}>
            IT, медицина, наука, спорт и ещё 16 тем. Сбор по расписанию каждого
            источника — от 2 до 12 часов.
          </p>
          {data.updatedAt && (
            <p style={{ marginTop: "1.5rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              {articles.length} новостей · обновлено{" "}
              {new Date(data.updatedAt).toLocaleString("ru-RU")}
            </p>
          )}
        </div>
      </section>

      {articles.length === 0 ? (
        <section className="container" style={{ padding: "2rem 0 4rem" }}>
          <div
            style={{
              padding: "3rem",
              textAlign: "center",
              background: "var(--bg-elevated)",
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
            }}
          >
            <p className="serif" style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
              Новостей пока нет
            </p>
            <p style={{ color: "var(--text-muted)" }}>
              Запустите <code style={{ color: "var(--accent)" }}>npm run collect</code> или
              дождитесь автоматизации Cursor.
            </p>
          </div>
        </section>
      ) : (
        <section className="container" style={{ padding: "2rem 0" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {featured.map((a) => (
              <NewsCard key={a.id} article={a} featured />
            ))}
            {rest.map((a) => (
              <NewsCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}

      <CategoryGrid categories={sources} />
    </>
  );
}
