import { notFound } from "next/navigation";
import { ArticlePageView } from "@/components/article-page-view";
import { getArticle, getBlogByHandle, getProductsByHandles } from "@/lib/storefront";

type Params = Promise<{ blog: string; slug: string }>;

export default async function ArticleRoute({ params }: { params: Params }) {
  const { blog, slug } = await params;
  const blogEntry = getBlogByHandle(blog);
  const article = getArticle(blog, slug);
  if (!blogEntry || !article) {
    notFound();
  }

  const relatedProducts = getProductsByHandles(article.relatedProductHandles).slice(0, 3);

  return <ArticlePageView article={article} blogTitle={blogEntry.title} relatedProducts={relatedProducts} />;
}
