import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { ProductPurchaseCard } from "@/components/product-purchase-card";
import { cleanRichText, getProductByHandle, getProductRecommendations } from "@/lib/storefront";

type Params = Promise<{ handle: string }>;

export default async function ProductRoute({ params }: { params: Params }) {
  const { handle } = await params;
  const product = getProductByHandle(handle);

  if (!product) {
    notFound();
  }

  const recommendations = getProductRecommendations(product, 4);

  return (
    <section className="shell page-section">
      <div className="breadcrumbs">
        <Link href="/collections/all-products">Shop all</Link>
        <span>/</span>
        <span>{product.title}</span>
      </div>

      <div className="product-page">
        <div className="product-page__grid">
          <ProductGallery images={product.images} title={product.title} />

          <div className="product-page__summary">
            <p className="eyebrow">{product.type || "Product"}</p>
            <h1>{product.title}</h1>
            <p className="product-page__lede">{product.summary}</p>

            {product.rating ? (
              <p className="product-page__rating">
                {product.rating.toFixed(1)} / 5
                {product.reviewsCount ? ` · ${product.reviewsCount} reviews` : ""}
              </p>
            ) : null}

            {product.keywords ? <p className="product-page__keywords">{product.keywords}</p> : null}

            <ProductPurchaseCard product={product} />

            {product.collectionHandles.length ? (
              <div className="tag-list">
                {product.collectionHandles.slice(0, 6).map((collectionHandle) => (
                  <Link key={collectionHandle} href={`/collections/${collectionHandle}`} className="tag">
                    {collectionHandle.replace(/-/g, " ")}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="surface-card rich-text">
          <p className="eyebrow">Description</p>
          <div dangerouslySetInnerHTML={{ __html: cleanRichText(product.descriptionHtml) }} />
        </div>

        <div className="page-heading">
          <div>
            <p className="eyebrow">Excellence. Made effortless.</p>
            <h2>Recommended next in the routine</h2>
          </div>
          <p className="section-copy">Products often paired with this part of the routine.</p>
        </div>

        <div className="product-grid">
          {recommendations.map((item) => (
            <ProductCard key={item.handle} product={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
