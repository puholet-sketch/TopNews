import { getNewsData } from "@/lib/news";

export function Footer() {
  const data = getNewsData();
  const updated = data.updatedAt
    ? new Date(data.updatedAt).toLocaleString("ru-RU")
    : "ещё не обновлялось";

  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        marginTop: "4rem",
        padding: "2rem 0",
        color: "var(--text-muted)",
        fontSize: "0.875rem",
      }}
    >
      <div className="container" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <span>TopNews — автоматический сбор RSS</span>
        <span>Последнее обновление: {updated}</span>
      </div>
    </footer>
  );
}
