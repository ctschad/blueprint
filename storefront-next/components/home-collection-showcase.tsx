"use client";

import { useState } from "react";
import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { OptimizedImage } from "@/components/optimized-image";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/lib/types";

type Tab = {
  handle: string;
  label: string;
  description: string;
  products: Product[];
};

function BenefitProductCard({ product }: { product: Product }) {
  const variant = product.variants.find((item) => item.available) ?? product.variants[0];
  const image = product.images[0];

  return (
    <article className="benefit-product-card">
      <Link href={`/products/${product.handle}`} className="benefit-product-card__image-wrap">
        {image ? (
          <OptimizedImage
            src={image.src}
            alt={image.alt}
            className="benefit-product-card__image"
            sizes="(min-width: 1200px) 18vw, (min-width: 768px) 28vw, 80vw"
          />
        ) : null}
      </Link>

      <div className="benefit-product-card__body">
        <Link href={`/products/${product.handle}`} className="benefit-product-card__title">
          {product.title}
        </Link>
        {product.keywords ? <p className="benefit-product-card__keywords">{product.keywords}</p> : null}
        <p className="benefit-product-card__price">{formatMoney(product.priceMin)}</p>

        {variant ? (
          <AddToCartButton
            className="button button--solid button--full"
            productHandle={product.handle}
            productTitle={product.title}
            variantId={variant.id}
            variantTitle={variant.publicTitle || variant.title}
            price={variant.price}
            image={image?.src}
          />
        ) : (
          <Link href={`/products/${product.handle}`} className="button button--ghost button--full">
            View Details
          </Link>
        )}
      </div>
    </article>
  );
}

export function HomeCollectionShowcase({ tabs }: { tabs: Tab[] }) {
  const [activeHandle, setActiveHandle] = useState(tabs[0]?.handle ?? "");
  const activeTab = tabs.find((tab) => tab.handle === activeHandle) ?? tabs[0];

  if (!activeTab) {
    return null;
  }

  return (
    <section className="shell page-section benefit-showcase">
      <div className="benefit-showcase__heading">
        <h2>
          Your needs, <span className="benefit-showcase__highlight">fully supported</span>
        </h2>
      </div>

      <div className="benefit-showcase__tabs" role="tablist" aria-label="Shop by benefit">
        {tabs.map((tab) => (
          <button
            key={tab.handle}
            type="button"
            className={`benefit-showcase__tab ${tab.handle === activeTab.handle ? "is-active" : ""}`}
            onClick={() => setActiveHandle(tab.handle)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="benefit-showcase__grid">
        {activeTab.products.slice(0, 5).map((product) => (
          <BenefitProductCard key={product.handle} product={product} />
        ))}
      </div>
    </section>
  );
}
