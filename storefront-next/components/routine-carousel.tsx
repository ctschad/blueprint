"use client";

import { useLayoutEffect, useRef, type MouseEvent, type PointerEvent, type WheelEvent } from "react";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/types";

export function RoutineCarousel({ products }: { products: Product[] }) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const lastPointerXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const suppressClickRef = useRef(false);
  const dragDistanceRef = useRef(0);
  const offsetRef = useRef(0);
  const maxOffsetRef = useRef(0);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const rail = railRef.current;
    const track = trackRef.current;

    if (!viewport || !rail || !track || products.length === 0) {
      return;
    }

    function clampOffset(nextOffset: number) {
      return Math.max(0, Math.min(nextOffset, maxOffsetRef.current));
    }

    function applyOffset() {
      if (!railRef.current) {
        return;
      }

      railRef.current.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
    }

    function syncMeasurements() {
      const viewportWidth = viewportRef.current?.getBoundingClientRect().width ?? 0;
      const track = trackRef.current;

      if (!track || !viewportWidth) {
        maxOffsetRef.current = 0;
        offsetRef.current = 0;
        applyOffset();
        return;
      }

      const lastCard = track.lastElementChild as HTMLElement | null;
      const lastCardEdge = lastCard ? lastCard.offsetLeft + lastCard.offsetWidth : track.scrollWidth;
      maxOffsetRef.current = Math.max(0, lastCardEdge - viewportWidth);
      offsetRef.current = clampOffset(offsetRef.current);
      applyOffset();
    }

    syncMeasurements();

    const resizeObserver = new ResizeObserver(() => {
      syncMeasurements();
    });

    resizeObserver.observe(viewport);
    resizeObserver.observe(track);

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

    offsetRef.current = Math.max(0, Math.min(offsetRef.current - delta, maxOffsetRef.current));

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
    const horizontalDelta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;

    if (!horizontalDelta) {
      return;
    }

    if (!railRef.current) {
      return;
    }

    event.preventDefault();
    offsetRef.current = Math.max(0, Math.min(offsetRef.current + horizontalDelta, maxOffsetRef.current));
    railRef.current.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
  }

  return (
    <div className="routine-carousel" aria-label="Routine products">
      <div
        ref={viewportRef}
        className="routine-carousel__viewport"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        onClickCapture={handleClickCapture}
        onWheel={handleWheel}
      >
        <div ref={railRef} className="routine-carousel__rail">
          <div ref={trackRef} className="bestsellers-carousel__track routine-carousel__track">
            {products.map((product) => (
              <div key={product.handle} className="bestsellers-carousel__card">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
