import Link from "next/link";
import { notFound } from "next/navigation";
import { ResilientImage } from "@/components/resilient-image";
import { getArticlesForBlog, getBlogByHandle } from "@/lib/storefront";

type Params = Promise<{ blog: string }>;

export default async function BlogPage({ params }: { params: Params }) {
  const { blog } = await params;
  const blogEntry = getBlogByHandle(blog);
  if (!blogEntry) {
    notFound();
  }

  const articles = getArticlesForBlog(blog);

  return (
    <section className="shell page-section">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Blog</p>
          <h1>{blogEntry.title}</h1>
        </div>
        <p className="section-copy section-copy--narrow">{blogEntry.description}</p>
      </div>

      <div className="article-grid">
        {articles.map((article) => (
          <Link key={article.slug} href={`/blogs/${blog}/${article.slug}`} className="article-card">
            {article.image ? (
              <ResilientImage src={article.image} alt={article.title} className="article-card__image" />
            ) : null}
            <div className="article-card__body">
              <h2>{article.title}</h2>
              <p>{article.description}</p>
              {article.tags.length ? <span className="article-card__tags">{article.tags.join(" · ")}</span> : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
