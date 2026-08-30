import { HomeView } from "@/components/HomeView";
import { getAllArticles, getCategoryBuckets, getNewsData, getSources } from "@/lib/news";

export default function HomePage() {
  const articles = getAllArticles();
  const sources = getSources();
  const data = getNewsData();
  const buckets = getCategoryBuckets();

  return (
    <HomeView
      articles={articles}
      sources={sources}
      updatedAt={data.updatedAt}
      buckets={buckets}
    />
  );
}
