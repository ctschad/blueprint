import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { RichContentRenderer } from "@/components/rich-content-renderer";
import { ResilientImage } from "@/components/resilient-image";
import type { Article, Product } from "@/lib/types";

type Props = {
  article: Article;
  blogTitle: string;
  relatedProducts: Product[];
};

function formatPublishedDate(article: Article) {
  if (article.publishedAt) {
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(article.publishedAt)
      ? new Date(`${article.publishedAt}T12:00:00`)
      : new Date(article.publishedAt);
    if (!Number.isNaN(parsed.getTime())) {
      return new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
      }).format(parsed);
    }
  }

  return article.publishedLabel ?? null;
}

export function ArticlePageView({ article, blogTitle, relatedProducts }: Props) {
  const publishedDate = formatPublishedDate(article);

  return (
    <section className="shell page-section article-page">
      <div className="breadcrumbs">
        <Link href={`/blogs/${article.blogHandle}`}>{blogTitle}</Link>
        <span>/</span>
        <span>{article.title}</span>
      </div>

      <div className="page-heading">
        <div>
          <p className="eyebrow">{blogTitle}</p>
          <h1>{article.title}</h1>
        </div>
      </div>

      {article.description ? <p className="section-copy section-copy--narrow">{article.description}</p> : null}

      {(article.author || publishedDate || article.tags.length > 0) ? (
        <div className="article-meta">
          {article.author ? <span>{article.author}</span> : null}
          {publishedDate ? <span>{publishedDate}</span> : null}
          {article.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="article-layout">
        {article.bodyHtml ? (
          <article className="surface-card article-content">
            <RichContentRenderer blocks={article.bodyBlocks ?? []} />
          </article>
        ) : (
          <div className="empty-state">
            <h2>This article is still being prepared.</h2>
            <p>Please check back soon.</p>
          </div>
        )}

        {article.relatedArticles.length ? (
          <aside className="surface-card article-sidebar">
            <div>
              <p className="eyebrow">Related Articles</p>
              <h2>Keep reading</h2>
            </div>

            <div className="article-sidebar__list">
              {article.relatedArticles.map((item) => (
                <Link key={item.href} href={item.href} className="article-sidebar__item">
                  {item.image ? (
                    <ResilientImage src={item.image} alt={item.title} className="article-sidebar__image" />
                  ) : null}
                  <div className="article-sidebar__body">
                    {item.tag ? <p className="article-card__tags">{item.tag}</p> : null}
                    <h3>{item.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </aside>
        ) : null}
      </div>

      {relatedProducts.length ? (
        <div className="article-products">
          <div className="page-heading">
            <div>
              <p className="eyebrow">Shop Related Products</p>
              <h2>Continue the routine</h2>
            </div>
            <p className="section-copy">Products often explored alongside this topic.</p>
          </div>

          <div className="product-grid">
            {relatedProducts.map((product) => (
              <ProductCard key={product.handle} product={product} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
