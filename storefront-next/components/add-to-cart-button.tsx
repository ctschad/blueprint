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
  label = "Add to Cart"
}: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

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
      {disabled ? "Unavailable" : added ? "Added" : label}
    </button>
  );
}
