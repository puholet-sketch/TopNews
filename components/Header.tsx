"use client";

import Link from "next/link";
import { useState } from "react";
import type { SourceCategory } from "@/lib/types";

export function Header({ sources }: { sources: SourceCategory[] }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark">
            Top<span>News</span>
          </span>
          <span className="brand-tag">20 тем · топ-5</span>
        </Link>

        <nav className="nav-desktop" aria-label="Темы">
          {sources.map((s) => (
            <Link key={s.id} href={`/category/${s.slug}`} className="nav-link">
              {s.name}
            </Link>
          ))}
        </nav>

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

      <div id="mobile-nav" className={`nav-drawer ${open ? "open" : ""}`}>
        <div className="container nav-drawer-grid">
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
