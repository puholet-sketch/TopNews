"use client";

import { useState } from "react";

interface NewsImageProps {
  src: string | null;
  fallback: string;
  alt: string;
  eager?: boolean;
}

export function NewsImage({ src, fallback, alt, eager = false }: NewsImageProps) {
  const [current, setCurrent] = useState(src || fallback);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : "low"}
      referrerPolicy="no-referrer"
      onError={() => {
        if (current !== fallback) setCurrent(fallback);
      }}
    />
  );
}
