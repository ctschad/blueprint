"use client";

import { useState } from "react";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { formatMoney } from "@/lib/money";
import { isSubscriptionEligible } from "@/lib/subscription-eligibility";
import type { Product } from "@/lib/types";

export function ProductPurchaseCard({ product }: { product: Product }) {
  const availableVariant =
    product.variants.find((variant) => variant.available) ?? product.variants[0] ?? null;
  const [variantId, setVariantId] = useState(availableVariant?.id ?? 0);
  const [quantity, setQuantity] = useState(1);

  const selectedVariant =
    product.variants.find((variant) => variant.id === variantId) ?? availableVariant;

  if (!selectedVariant) {
    return <div className="purchase-card">No purchase options are available.</div>;
  }

  return (
    <div className="purchase-card">
      <div className="purchase-card__price-block">
        <p className="purchase-card__price">{formatMoney(selectedVariant.price)}</p>
        {selectedVariant.compareAtPrice ? (
          <p className="purchase-card__compare">{formatMoney(selectedVariant.compareAtPrice)}</p>
        ) : null}
      </div>

      {product.variants.length > 1 ? (
        <label className="field">
          <span>Choose a size</span>
          <select value={variantId} onChange={(event) => setVariantId(Number(event.target.value))}>
            {product.variants.map((variant) => (
              <option key={variant.id} value={variant.id} disabled={!variant.available}>
                {(variant.publicTitle || variant.title) + (!variant.available ? " · Sold out" : "")}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="field">
        <span>Quantity</span>
        <input
          type="number"
          min={1}
          max={12}
          value={quantity}
          onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
        />
      </label>

      <AddToCartButton
        className="button button--solid button--full"
        productHandle={product.handle}
        productTitle={product.title}
        variantId={selectedVariant.id}
        variantTitle={selectedVariant.publicTitle || selectedVariant.title}
        price={selectedVariant.price}
        image={product.images[0]?.src}
        quantity={quantity}
        disabled={!selectedVariant.available}
      />

      {product.sellingPlanGroups.length > 0 && isSubscriptionEligible(product.handle) ? (
        <div className="purchase-card__subscription-note">
          <p>Subscription plans are available for this product.</p>
          <ul>
            {product.sellingPlanGroups.slice(0, 3).map((plan) => (
              <li key={plan.id}>{plan.name}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
