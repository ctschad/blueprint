"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, type MouseEvent, type PointerEvent, type WheelEvent } from "react";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { formatMoney } from "@/lib/storefront";
import type { Product } from "@/lib/types";

const LOOP_COPIES = 5;
const CENTER_COPY_INDEX = Math.floor(LOOP_COPIES / 2);

function wrapOffset(offset: number, cycleWidth: number) {
  if (!cycleWidth) {
    return offset;
  }

  let normalized = offset;
  const minOffset = cycleWidth * CENTER_COPY_INDEX;
  const maxOffset = cycleWidth * (CENTER_COPY_INDEX + 1);

  while (normalized < minOffset) {
    normalized += cycleWidth;
  }

  while (normalized >= maxOffset) {
    normalized -= cycleWidth;
  }

  return normalized;
}

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
  const railRef = useRef<HTMLDivElement | null>(null);
  const segmentRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const lastPointerXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const suppressClickRef = useRef(false);
  const dragDistanceRef = useRef(0);
  const cycleWidthRef = useRef(0);
  const offsetRef = useRef(0);

  useLayoutEffect(() => {
    const rail = railRef.current;
    const segment = segmentRef.current;
    if (!rail || !segment || products.length === 0) {
      return;
    }

    function getSegmentWidth() {
      return segmentRef.current?.getBoundingClientRect().width ?? 0;
    }

    function applyOffset() {
      const rail = railRef.current;
      if (!rail) {
        return;
      }

      rail.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
    }

    function syncOffset(nextOffset?: number) {
      const cycleWidth = getSegmentWidth();
      if (!cycleWidth) {
        return;
      }

      const nextWrappedOffset =
        typeof nextOffset === "number" ? wrapOffset(nextOffset, cycleWidth) : cycleWidth * CENTER_COPY_INDEX;
      cycleWidthRef.current = cycleWidth;
      offsetRef.current = nextWrappedOffset;
      applyOffset();
    }

    syncOffset();

    const resizeObserver = new ResizeObserver(() => {
      const nextWidth = getSegmentWidth();
      const previousWidth = cycleWidthRef.current;

      if (!nextWidth) {
        return;
      }

      if (!previousWidth) {
        syncOffset();
        return;
      }

      const relativeOffset = previousWidth ? offsetRef.current / previousWidth : CENTER_COPY_INDEX;
      syncOffset(nextWidth * relativeOffset);
    });

    resizeObserver.observe(segment);

    return () => {
      resizeObserver.disconnect();
    };
  }, [products]);

  if (products.length === 0) {
    return null;
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest("button, input, select, textarea, label")) {
      return;
    }

    const viewport = viewportRef.current;
    if (!viewport || !cycleWidthRef.current) {
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

    offsetRef.current = wrapOffset(offsetRef.current - delta, cycleWidthRef.current);

    if (railRef.current) {
      railRef.current.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
    }
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

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    const horizontalDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ? event.deltaX
      : event.shiftKey
        ? event.deltaY
        : 0;

    if (!horizontalDelta) {
      return;
    }

    if (!cycleWidthRef.current) {
      return;
    }

    event.preventDefault();
    offsetRef.current = wrapOffset(offsetRef.current + horizontalDelta, cycleWidthRef.current);

    if (railRef.current) {
      railRef.current.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
    }
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
        onClickCapture={handleClickCapture}
        onWheel={handleWheel}
      >
        <div ref={railRef} className="bestsellers-carousel__rail">
          {Array.from({ length: LOOP_COPIES }, (_, copyIndex) => (
            <div
              key={`copy-${copyIndex}`}
              className="bestsellers-carousel__track"
              ref={copyIndex === CENTER_COPY_INDEX ? segmentRef : undefined}
            >
              {products.map((product) => (
                <ProductCardCarouselItem key={`${copyIndex}-${product.handle}`} product={product} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
