import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const variant = product.variants.find((item) => item.available) ?? product.variants[0];
  const image = product.images[0];

  return (
    <article className="product-card">
      <Link href={`/products/${product.handle}`} className="product-card__image-wrap">
        {image ? <img src={image.src} alt={image.alt} className="product-card__image" /> : null}
      </Link>

      <div className="product-card__body">
        <div className="product-card__meta">
          {product.keywords ? <p className="product-card__keywords">{product.keywords}</p> : null}
          {product.rating ? (
            <p className="product-card__rating">
              {product.rating.toFixed(1)} / 5
              {product.reviewsCount ? ` · ${product.reviewsCount} reviews` : ""}
            </p>
          ) : null}
        </div>

        <Link href={`/products/${product.handle}`} className="product-card__title">
          {product.title}
        </Link>
        <p className="product-card__summary">{product.summary}</p>

        <div className="product-card__footer">
          <div>
            <p className="product-card__price">{formatMoney(product.priceMin)}</p>
            {product.sellingPlanGroups.length > 0 ? (
              <p className="product-card__subscription">Subscription available</p>
            ) : null}
          </div>

          {variant ? (
            <AddToCartButton
              className="button button--solid"
              productHandle={product.handle}
              productTitle={product.title}
              variantId={variant.id}
              variantTitle={variant.publicTitle || variant.title}
              price={variant.price}
              image={image?.src}
            />
          ) : (
            <Link href={`/products/${product.handle}`} className="button button--ghost">
              View Details
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
