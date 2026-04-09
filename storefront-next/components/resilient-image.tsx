"use client";

import { useState } from "react";

type ResilientImageProps = {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
};

const defaultFallbackSrc = "/cdn/shop/files/placeholder-2_385x215_crop_center__q_526e273fc83f.png";

export function ResilientImage({
  src,
  alt,
  className,
  fallbackSrc = defaultFallbackSrc
}: ResilientImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}
