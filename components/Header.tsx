import Link from "next/link";
import { getSources } from "@/lib/news";

export function Header() {
  const sources = getSources();

  return (
    <header
      style={{
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(12px)",
        background: "rgba(10, 10, 11, 0.85)",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 0",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
          <span className="serif" style={{ fontSize: "1.75rem", letterSpacing: "-0.02em" }}>
            TopNews
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            20 тем × 5 новостей
          </span>
        </Link>
        <nav
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          {sources.slice(0, 8).map((s) => (
            <Link
              key={s.id}
              href={`/category/${s.slug}`}
              style={{
                fontSize: "0.8rem",
                padding: "0.35rem 0.75rem",
                borderRadius: "999px",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
                transition: "all 0.2s",
              }}
            >
              {s.name.split(" ")[0]}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
