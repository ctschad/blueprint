"use client";

import { useState } from "react";
import { OptimizedImage } from "@/components/optimized-image";
import type { ProductImage } from "@/lib/types";

export function ProductGallery({ images, title }: { images: ProductImage[]; title: string }) {
  const [selected, setSelected] = useState(0);
  const active = images[selected] ?? images[0];

  if (!active) {
    return <div className="product-gallery product-gallery--empty">No imagery available yet.</div>;
  }

  return (
    <div className="product-gallery">
      <div className="product-gallery__stage">
        <OptimizedImage
          src={active.src}
          alt={active.alt || title}
          className="product-gallery__main-image"
          sizes="(min-width: 1200px) 48vw, 100vw"
          priority
        />
      </div>

      {images.length > 1 ? (
        <div className="product-gallery__thumbs">
          {images.map((image, index) => (
            <button
              key={`${image.src}-${index}`}
              type="button"
              className={`product-gallery__thumb ${selected === index ? "is-active" : ""}`}
              onClick={() => setSelected(index)}
            >
              <OptimizedImage
                src={image.src}
                alt={image.alt || title}
                className="product-gallery__thumb-image"
                sizes="(min-width: 1200px) 10vw, 18vw"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
