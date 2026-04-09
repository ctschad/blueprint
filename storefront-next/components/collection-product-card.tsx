import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/lib/types";

function renderStars(rating: number | null | undefined) {
  if (!rating) {
    return null;
  }

  const filled = Math.max(1, Math.min(5, Math.round(rating)));
  return (
    <span className="collection-product-card__stars" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {"★".repeat(filled)}
    </span>
  );
}

function formatKeywords(keywords: string) {
  return keywords.replace(/\s*\|\s*/g, " • ");
}

export function CollectionProductCard({ product }: { product: Product }) {
  const variant = product.variants.find((item) => item.available) ?? product.variants[0];
  const image = variant?.featuredImage ?? product.images[0]?.src;
  const imageAlt = product.images[0]?.alt ?? product.title;

  return (
    <article className="collection-product-card">
      <Link href={`/products/${product.handle}`} className="collection-product-card__image-wrap">
        {image ? <img src={image} alt={imageAlt} className="collection-product-card__image" /> : null}
      </Link>

      <div className="collection-product-card__body">
        <div className="collection-product-card__rating-row">
          <div className="collection-product-card__rating">
            {renderStars(product.rating)}
            {product.reviewsCount ? (
              <span className="collection-product-card__reviews">({product.reviewsCount})</span>
            ) : null}
          </div>
        </div>

        <Link href={`/products/${product.handle}`} className="collection-product-card__title">
          {product.title}
        </Link>

        {product.keywords ? (
          <p className="collection-product-card__keywords">{formatKeywords(product.keywords)}</p>
        ) : null}

        {variant ? (
          <AddToCartButton
            className="button button--solid collection-product-card__button"
            productHandle={product.handle}
            productTitle={product.title}
            variantId={variant.id}
            variantTitle={variant.publicTitle || variant.title}
            price={variant.price}
            image={image}
            label="Add to Cart"
            trailingLabel={formatMoney(variant.price)}
          />
        ) : (
          <Link href={`/products/${product.handle}`} className="button button--ghost collection-product-card__button">
            <span className="button__label">View Details</span>
          </Link>
        )}
      </div>
    </article>
  );
}
