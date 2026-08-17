import { getHealth, getNewsData } from "@/lib/news";

export function Footer() {
  const data = getNewsData();
  const health = getHealth();
  const updated = data.updatedAt
    ? new Date(data.updatedAt).toLocaleString("ru-RU")
    : "ещё не обновлялось";
  const healthLabel =
    health?.status === "ok"
      ? "диагностика: ок"
      : health?.status === "warn"
        ? `диагностика: ${health.warnings.length} предупр.`
        : health?.status === "fail"
          ? `диагностика: ${health.issues.length} проблем`
          : "диагностика: нет данных";

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
          <div>Последнее обновление ленты: {updated}</div>
          <div style={{ marginTop: "0.35rem" }}>{healthLabel}</div>
        </div>
      </div>
    </footer>
  );
}
