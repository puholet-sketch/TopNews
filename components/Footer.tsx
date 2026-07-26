import { getNewsData } from "@/lib/news";

export function Footer() {
  const data = getNewsData();
  const updated = data.updatedAt
    ? new Date(data.updatedAt).toLocaleString("ru-RU")
    : "ещё не обновлялось";

  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div>
          <strong style={{ color: "var(--ink)" }}>TopNews</strong>
          <p style={{ marginTop: "0.35rem" }}>
            Автосбор топ-новостей на русском · без редакционной правки текстов
          </p>
        </div>
        <div>
          <div>Последнее обновление: {updated}</div>
          <div style={{ marginTop: "0.35rem" }}>Источники указаны у каждой новости</div>
        </div>
      </div>
    </footer>
  );
}
