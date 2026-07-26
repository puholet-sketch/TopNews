"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { SourceCategory } from "@/lib/types";

export function Header({ sources }: { sources: SourceCategory[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark">
            Top<span>News</span>
          </span>
          <span className="brand-tag">20 тем · топ-5</span>
        </Link>

        <button
          className="menu-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Закрыть меню" : "Открыть меню"}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
        </button>
      </div>

      <nav className="topics-bar" aria-label="Все темы">
        <div className="container topics-bar-inner">
          <Link
            href="/"
            className={`topic-link ${pathname === "/" || pathname === "" ? "active" : ""}`}
            onClick={() => setOpen(false)}
          >
            Главная
          </Link>
          {sources.map((s) => {
            const href = `/category/${s.slug}`;
            const active = pathname === href || pathname?.endsWith(href);
            return (
              <Link
                key={s.id}
                href={href}
                className={`topic-link ${active ? "active" : ""}`}
                onClick={() => setOpen(false)}
              >
                {s.name}
              </Link>
            );
          })}
        </div>
      </nav>

      <div id="mobile-nav" className={`nav-drawer ${open ? "open" : ""}`}>
        <div className="container nav-drawer-grid">
          <Link href="/" onClick={() => setOpen(false)}>
            Главная
          </Link>
          {sources.map((s) => (
            <Link
              key={s.id}
              href={`/category/${s.slug}`}
              onClick={() => setOpen(false)}
            >
              {s.name}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
