import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getNewsData, getSources } from "@/lib/news";

export const metadata: Metadata = {
  title: {
    default: "TopNews — топ новостей на русском",
    template: "%s — TopNews",
  },
  description:
    "Свежие топ-новости по темам из русскоязычных источников: IT, спорт, СВО, экология и другие.",
  openGraph: {
    title: "TopNews",
    description: "Автоагрегатор топ-новостей на русском языке",
    locale: "ru_RU",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const sources = getSources();
  const data = getNewsData();

  return (
    <html lang="ru">
      <body>
        <Header sources={sources} updatedAt={data.updatedAt} />
        <main id="content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
