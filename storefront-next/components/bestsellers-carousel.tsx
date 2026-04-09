"use client";

import Link from "next/link";
import { useRef, type MouseEvent, type PointerEvent } from "react";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/lib/types";

function ProductCardCarouselItem({ product }: { product: Product }) {
  const variant = product.variants.find((item) => item.available) ?? product.variants[0];
  const image = product.images[0];

  return (
    <article className="product-card bestsellers-carousel__card">
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
              View details
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export function BestsellersCarousel({ products }: { products: Product[] }) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const lastPointerXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const suppressClickRef = useRef(false);
  const dragDistanceRef = useRef(0);

  if (products.length === 0) {
    return null;
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest("button, input, select, textarea, label")) {
      return;
    }

    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    isDraggingRef.current = true;
    suppressClickRef.current = false;
    dragDistanceRef.current = 0;
    lastPointerXRef.current = event.clientX;
    viewport.classList.add("is-dragging");
    viewport.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    if (!viewport || !isDraggingRef.current) {
      return;
    }

    const delta = event.clientX - lastPointerXRef.current;
    lastPointerXRef.current = event.clientX;
    dragDistanceRef.current += Math.abs(delta);

    if (dragDistanceRef.current > 6) {
      suppressClickRef.current = true;
    }

    viewport.scrollLeft -= delta;
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    if (!viewport || !isDraggingRef.current) {
      return;
    }

    isDraggingRef.current = false;
    viewport.classList.remove("is-dragging");

    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }

    if (suppressClickRef.current) {
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }
  }

  function handleClickCapture(event: MouseEvent<HTMLDivElement>) {
    if (!suppressClickRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <div className="bestsellers-carousel" aria-label="Bestseller products">
      <div
        ref={viewportRef}
        className="bestsellers-carousel__viewport"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        onClickCapture={handleClickCapture}
      >
        <div className="bestsellers-carousel__rail">
          <div className="bestsellers-carousel__track">
            {products.map((product) => (
              <ProductCardCarouselItem key={product.handle} product={product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
