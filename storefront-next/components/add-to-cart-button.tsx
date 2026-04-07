"use client";

import { useState } from "react";
import { useCart } from "@/components/storefront-provider";

type Props = {
  productHandle: string;
  productTitle: string;
  variantId: number;
  variantTitle: string;
  price: number;
  quantity?: number;
  image?: string | null;
  className?: string;
  disabled?: boolean;
  label?: string;
  trailingLabel?: string;
};

export function AddToCartButton({
  productHandle,
  productTitle,
  variantId,
  variantTitle,
  price,
  quantity = 1,
  image,
  className,
  disabled,
  label = "Add to Cart",
  trailingLabel
}: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const buttonLabel = disabled ? "Unavailable" : added ? "Added" : label;

  return (
    <button
      type="button"
      disabled={disabled}
      className={className}
      onClick={() => {
        addItem(
          {
            productHandle,
            productTitle,
            variantId,
            variantTitle,
            price,
            image
          },
          quantity
        );
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1400);
      }}
    >
      {trailingLabel && !disabled && !added ? (
        <>
          <span className="button__label">{buttonLabel}</span>
          <span className="button__trailing">{trailingLabel}</span>
        </>
      ) : (
        buttonLabel
      )}
    </button>
  );
}
