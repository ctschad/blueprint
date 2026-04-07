"use client";

import Link from "next/link";
import { useState } from "react";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { useCart } from "@/components/storefront-provider";
import { formatMoney } from "@/lib/storefront";
import type { Product } from "@/lib/types";

const SLOT_LABELS = [
  "Add your first item",
  "Add your second item",
  "Add your third item",
  "Add your fourth item"
];

const INITIAL_VISIBLE_ITEMS = 6;
const LOAD_MORE_COUNT = 6;

export type BuildMyStackItem = {
  product: Product;
  badge?: string;
};

function formatKeywords(keywords: string) {
  return keywords.replace(/\s*\|\s*/g, " • ");
}

function getPrimaryVariant(product: Product) {
  return product.variants.find((variant) => variant.available) ?? product.variants[0];
}

function getSubscriptionPrice(cents: number) {
  return Math.round(cents * 0.95);
}

function StackSlotIcon() {
  return (
    <svg
      className="build-stack-slot__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7.5 9.25V7.5a4.5 4.5 0 0 1 9 0v1.75" />
      <path d="M6 9.25h12l-.72 9.5a1.5 1.5 0 0 1-1.5 1.38H8.22a1.5 1.5 0 0 1-1.5-1.38L6 9.25Z" />
    </svg>
  );
}

export function BuildMyStackPage({
  items,
  starterStacks
}: {
  items: BuildMyStackItem[];
  starterStacks: Product[];
}) {
  const { addItem } = useCart();
  const [selectedHandles, setSelectedHandles] = useState<string[]>([]);
  const [addedBundle, setAddedBundle] = useState(false);
  const [visibleItemCount, setVisibleItemCount] = useState(INITIAL_VISIBLE_ITEMS);

  const visibleItems = items.slice(0, visibleItemCount);
  const hasMoreItems = visibleItemCount < items.length;

  const selectedItems = SLOT_LABELS.map((_, index) => {
    const handle = selectedHandles[index];
    return handle ? items.find((item) => item.product.handle === handle) ?? null : null;
  });

  function handleAdd(productHandle: string) {
    setSelectedHandles((current) => {
      if (current.includes(productHandle) || current.length >= SLOT_LABELS.length) {
        return current;
      }

      return [...current, productHandle];
    });
  }

  function handleRemove(index: number) {
    setSelectedHandles((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function handleSubscribe() {
    if (selectedHandles.length === 0) {
      return;
    }

    selectedItems.forEach((item) => {
      if (!item) {
        return;
      }

      const variant = getPrimaryVariant(item.product);
      const image = variant?.featuredImage ?? item.product.images[0]?.src ?? null;

      if (!variant) {
        return;
      }

      addItem({
        productHandle: item.product.handle,
        productTitle: item.product.title,
        variantId: variant.id,
        variantTitle: variant.publicTitle || variant.title,
        price: getSubscriptionPrice(variant.price),
        image
      });
    });

    setAddedBundle(true);
    window.setTimeout(() => setAddedBundle(false), 1500);
  }

  return (
    <>
      <section className="shell page-section build-stack-page">
        <div className="build-stack-hero">
          <picture>
            <source
              media="(max-width: 767px)"
              srcSet="/cdn/shop/files/hero-banner__bundle-builder__big-stack-grid--mobile__q_7d8bdb36b4b5.jpg"
            />
            <img
              src="/cdn/shop/files/hero-banner__bundle-builder__big-stack--desktop-ultrawide__q_4fdf995a4e7c.jpg"
              alt="Blueprint longevity products arranged on a textured light surface"
              className="build-stack-hero__image"
            />
          </picture>

          <div className="build-stack-hero__content">
            <h1 className="build-stack-hero__title">
              Save 5% when you build your own longevity stack
            </h1>
            <p className="build-stack-hero__copy">
              Build a personalized subscription stack. All protocols are precision dosed,
              third-party tested and trusted by Bryan Johnson.
            </p>
          </div>
        </div>

        <div className="build-stack-layout">
          <div className="build-stack-catalog">
            <div className="build-stack-grid" aria-label="Build my stack products">
              {visibleItems.map((item) => {
                const { product, badge } = item;
                const variant = getPrimaryVariant(product);
                const listPrice = variant?.compareAtPrice && variant.compareAtPrice > variant.price
                  ? variant.compareAtPrice
                  : product.priceMin;
                const subscriptionPrice = getSubscriptionPrice(variant?.price ?? product.priceMin);
                const imageSrc = variant?.featuredImage ?? product.images[0]?.src;
                const imageAlt = product.images[0]?.alt ?? product.title;
                const isSelected = selectedHandles.includes(product.handle);
                const isStackFull = selectedHandles.length >= SLOT_LABELS.length;
                const secondaryLinkLabel = product.variants.length > 1 ? "Choose Options" : "Learn More";

                return (
                  <article key={product.handle} className="build-stack-card">
                    <Link href={`/products/${product.handle}`} className="build-stack-card__image-wrap">
                      {badge ? <span className="build-stack-card__badge">{badge}</span> : null}
                      {imageSrc ? (
                        <img src={imageSrc} alt={imageAlt} className="build-stack-card__image" />
                      ) : (
                        <div className="build-stack-card__image build-stack-card__image--empty" />
                      )}
                    </Link>

                    <div className="build-stack-card__body">
                      <Link href={`/products/${product.handle}`} className="build-stack-card__title">
                        {product.title}
                      </Link>

                      {product.keywords ? (
                        <p className="build-stack-card__keywords">{formatKeywords(product.keywords)}</p>
                      ) : null}

                      <p className="build-stack-card__price-row">
                        <span className="build-stack-card__compare">{formatMoney(listPrice)}</span>
                        <span className="build-stack-card__price">{formatMoney(subscriptionPrice)}</span>
                      </p>

                      <button
                        type="button"
                        className="build-stack-card__button"
                        onClick={() => handleAdd(product.handle)}
                        disabled={isSelected || isStackFull}
                      >
                        {isSelected ? "Added to Stack" : isStackFull ? "Stack Full" : "Add to Stack"}
                      </button>

                      <Link href={`/products/${product.handle}`} className="build-stack-card__learn-more">
                        {secondaryLinkLabel}
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            {hasMoreItems ? (
              <div className="build-stack-catalog__more">
                <button
                  type="button"
                  className="build-stack-catalog__more-button"
                  onClick={() => setVisibleItemCount((current) => Math.min(current + LOAD_MORE_COUNT, items.length))}
                >
                  See More
                </button>
              </div>
            ) : null}
          </div>

          <aside className="build-stack-summary">
            <div className="build-stack-summary__panel">
              <h2 className="build-stack-summary__title">Your longevity stack ({selectedHandles.length})</h2>

              <div className="build-stack-summary__slots">
                {SLOT_LABELS.map((label, index) => {
                  const item = selectedItems[index];

                  return (
                    <div key={label} className="build-stack-slot">
                      <StackSlotIcon />
                      <div className="build-stack-slot__text">
                        <p className="build-stack-slot__label">
                          {item ? item.product.title : label}
                        </p>
                        {item?.product.keywords ? (
                          <p className="build-stack-slot__meta">{formatKeywords(item.product.keywords)}</p>
                        ) : null}
                      </div>

                      {item ? (
                        <button
                          type="button"
                          className="build-stack-slot__remove"
                          onClick={() => handleRemove(index)}
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className="build-stack-summary__cta"
                disabled={selectedHandles.length === 0}
                onClick={handleSubscribe}
              >
                {addedBundle ? "Added to Cart" : "Subscribe & Save"}
              </button>

              <p className="build-stack-summary__note">Ships monthly</p>
              <p className="build-stack-summary__note">Pause or cancel anytime</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="shell page-section build-stack-start">
        <div className="build-stack-start__heading">
          <p className="build-stack-start__eyebrow">Not Sure Where to Start?</p>
          <h2 className="build-stack-start__title">Try a stack designed by Bryan Johnson</h2>
        </div>

        <div className="build-stack-start__grid">
          {starterStacks.map((product) => {
            const variant = getPrimaryVariant(product);
            const imageSrc = variant?.featuredImage ?? product.images[0]?.src;
            const imageAlt = product.images[0]?.alt ?? product.title;

            if (!variant) {
              return null;
            }

            return (
              <article key={product.handle} className="build-stack-start__card">
                <Link href={`/products/${product.handle}`} className="build-stack-start__image-wrap">
                  {imageSrc ? (
                    <img src={imageSrc} alt={imageAlt} className="build-stack-start__image" />
                  ) : (
                    <div className="build-stack-start__image build-stack-start__image--empty" />
                  )}
                </Link>

                <div className="build-stack-start__body">
                  <Link href={`/products/${product.handle}`} className="build-stack-start__card-title">
                    {product.title}
                  </Link>
                  <p className="build-stack-start__keywords">{formatKeywords(product.keywords)}</p>
                  <p className="build-stack-start__price">{formatMoney(variant.price)}</p>
                  <AddToCartButton
                    className="build-stack-card__button build-stack-card__button--starter"
                    productHandle={product.handle}
                    productTitle={product.title}
                    variantId={variant.id}
                    variantTitle={variant.publicTitle || variant.title}
                    price={variant.price}
                    image={imageSrc}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
