"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/storefront-provider";
import { formatMoney } from "@/lib/money";

const FREE_SHIPPING_THRESHOLD = 5000;

const UPSELL_POOL = [
  {
    handle: "longevity-blend-multinutrient-drink-mix-blood-orange-flavor",
    title: "Longevity Mix - Blood Orange",
    price: 4900,
    image: "https://blueprint.bryanjohnson.com/cdn/shop/files/Blueprint_Longevity_Mix_supplement_pouch.webp?v=1769456711",
    variantId: 47190798696733,
    variantTitle: "Blood Orange / 1 Pouch"
  },
  {
    handle: "essentials-capsules",
    title: "Essential Capsules",
    price: 4900,
    image: "https://blueprint.bryanjohnson.com/cdn/shop/files/Blueprint_Essential_Capsules_Supplement_bottle.webp?v=1769456823",
    variantId: 47190771564829,
    variantTitle: "Default Title"
  },
  {
    handle: "advanced-antioxidants",
    title: "Advanced Antioxidants",
    price: 4900,
    image: "https://blueprint.bryanjohnson.com/cdn/shop/files/Blueprint_Advanced_Antioxidants_Supplement_Bottle_Delayed_Release_Capsules.webp?v=1769456712",
    variantId: 47190784639261,
    variantTitle: "Default Title"
  },
  {
    handle: "extra-virgin-olive-oil",
    title: "Extra Virgin Olive Oil",
    price: 3900,
    image: "https://blueprint.bryanjohnson.com/cdn/shop/files/Blueprint_Snake_Oil_Extra_Virgin_Olive_Oil_Bottle_Longevity_EVOO.webp?v=1769456712",
    variantId: 47471239790877,
    variantTitle: "1 Bottle"
  },
  {
    handle: "omega-3",
    title: "Omega-3",
    price: 3900,
    image: "https://blueprint.bryanjohnson.com/cdn/shop/files/Blueprint_Omega_3_supplement_bottle_1.webp?v=1769456711",
    variantId: 50548443185437,
    variantTitle: "Default Title"
  },
  {
    handle: "creatine",
    title: "Creatine",
    price: 4000,
    image: "https://blueprint.bryanjohnson.com/cdn/shop/files/Blueprint_Creatine_supplement_pouch.webp?v=1769456712",
    variantId: 49472442630429,
    variantTitle: "Default Title"
  },
  {
    handle: "collagen",
    title: "Collagen Peptides",
    price: 4500,
    image: "https://blueprint.bryanjohnson.com/cdn/shop/files/Blueprint_Collagen_supplement_pouch.webp?v=1769456768",
    variantId: 49472446628125,
    variantTitle: "Default Title"
  },
  {
    handle: "ceremonial-matcha",
    title: "Ceremonial Grade Matcha",
    price: 3500,
    image: "https://blueprint.bryanjohnson.com/cdn/shop/files/Blueprint_Matcha_Powder_Ceremonial_Grade_Green_Tea_Pouch.webp?v=1769456899",
    variantId: 49411367076125,
    variantTitle: "Default Title"
  },
  {
    handle: "raw-macadamias",
    title: "Raw Macadamias",
    price: 3500,
    image: "https://blueprint.bryanjohnson.com/cdn/shop/files/Blueprint_Raw_Macadamias_Unsalted_Single_Ingredient_Superfood_Pouch.webp?v=1769456903",
    variantId: 49182996300061,
    variantTitle: "Default Title"
  },
  {
    handle: "super-shrooms",
    title: "Super Shrooms",
    price: 3500,
    image: "https://blueprint.bryanjohnson.com/cdn/shop/files/Blueprint_Super_Shrooms_Functional_Mushroom_Blend_Pouch.webp?v=1769456649",
    variantId: 49480034091293,
    variantTitle: "Default Title"
  }
] as const;

const TRUST_MARKERS = [
  { label: "30 day satisfaction guarantee", icon: "rosette" },
  { label: "Over 1,000,000 reviews", icon: "shield" },
  { label: "Highest quality ingredients on the market", icon: "star" }
] as const;

function ProgressMessage({ remaining }: { remaining: number }) {
  if (remaining <= 0) {
    return (
      <p className="cart-drawer__shipping-copy">
        You unlocked <strong>FREE SHIPPING!</strong>
      </p>
    );
  }

  return (
    <p className="cart-drawer__shipping-copy">
      Add {formatMoney(remaining)} to get <strong>FREE SHIPPING!</strong>
    </p>
  );
}

function isDefaultVariant(variantTitle: string) {
  return !variantTitle || variantTitle === "Default Title";
}

function TrustIcon({ type }: { type: (typeof TRUST_MARKERS)[number]["icon"] }) {
  if (type === "shield") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3.75 18.75 6v5.25c0 4.1-2.65 7.84-6.75 9-4.1-1.16-6.75-4.9-6.75-9V6L12 3.75Z" />
        <path d="m9.2 11.9 1.85 1.85 3.75-4.05" />
      </svg>
    );
  }

  if (type === "star") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m12 4.5 2.2 4.45 4.9.72-3.55 3.45.85 4.88L12 15.65 7.6 18l.85-4.88L4.9 9.67l4.9-.72L12 4.5Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5.25a4.1 4.1 0 1 1 0 8.2 4.1 4.1 0 0 1 0-8.2Z" />
      <path d="m12 2.9 1.35 1.7 2.15-.15.75 2.02 2 .77-.2 2.15 1.68 1.37-1.1 1.86 1.1 1.86-1.68 1.37.2 2.15-2 .77-.75 2.02-2.15-.15L12 21.1l-1.35-1.7-2.15.15-.75-2.02-2-.77.2-2.15-1.68-1.37 1.1-1.86-1.1-1.86 1.68-1.37-.2-2.15 2-.77.75-2.02 2.15.15L12 2.9Z" />
    </svg>
  );
}

export function CartDrawer() {
  const { lines, isOpen, closeCart, removeLine, updateQuantity, subtotal, addItem } = useCart();
  const [subscriptionUpsells, setSubscriptionUpsells] = useState<Record<string, boolean>>({});
  const cartHandles = new Set(lines.map((line) => line.productHandle));
  const visibleUpsells = UPSELL_POOL.filter((item) => !cartHandles.has(item.handle)).slice(0, 3);
  const visibleUpsellHandlesKey = visibleUpsells.map((item) => item.handle).join("|");

  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const shippingProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  useEffect(() => {
    if (!isOpen) {
      setSubscriptionUpsells({});
    }
  }, [isOpen]);

  useEffect(() => {
    const visibleHandles = new Set<string>(visibleUpsells.map((item) => item.handle));

    setSubscriptionUpsells((current) => {
      const nextEntries = Object.entries(current).filter(
        ([handle, checked]) => checked && visibleHandles.has(handle)
      );

      if (
        nextEntries.length === Object.keys(current).length &&
        nextEntries.every(([handle, checked]) => current[handle] === checked)
      ) {
        return current;
      }

      return Object.fromEntries(nextEntries);
    });
  }, [visibleUpsellHandlesKey]);

  function toggleUpsell(handle: string) {
    setSubscriptionUpsells((current) => ({
      ...current,
      [handle]: !current[handle]
    }));
  }

  function addUpsell(item: (typeof UPSELL_POOL)[number]) {
    const isSubscription = Boolean(subscriptionUpsells[item.handle]);
    const price = isSubscription ? Math.round(item.price * 0.95) : item.price;
    const baseVariantTitle = isDefaultVariant(item.variantTitle) ? item.title : item.variantTitle;

    addItem({
      productHandle: item.handle,
      productTitle: item.title,
      variantId: item.variantId,
      variantTitle: isSubscription ? `${baseVariantTitle} · Subscription` : baseVariantTitle,
      price,
      image: item.image
    });
  }

  return (
    <div className={`cart-drawer ${isOpen ? "is-open" : ""}`} aria-hidden={!isOpen}>
      <button type="button" className="cart-drawer__backdrop" onClick={closeCart} />
      <aside className="cart-drawer__panel" role="dialog" aria-label="Your cart">
        <div className="cart-drawer__header">
          <h2 className="cart-drawer__heading">Your Cart</h2>
          <button type="button" className="cart-drawer__close cart-drawer__close--x" onClick={closeCart}>
            ×
          </button>
        </div>

        <div className="cart-drawer__body">
          <section className="cart-drawer__shipping">
            <div className="cart-drawer__progress" aria-hidden="true">
              <span style={{ width: `${shippingProgress}%` }} />
            </div>
            <ProgressMessage remaining={remainingForFreeShipping} />
          </section>

          {lines.length === 0 ? (
            <section className="cart-drawer__empty-state">
              <h3>Your cart is empty!</h3>
              <p>Add your favorite items to your cart.</p>
              <Link href="/collections/all-products" className="cart-drawer__primary-cta" onClick={closeCart}>
                Shop Now
              </Link>
            </section>
          ) : (
            <section className="cart-drawer__active-state">
              <div className="cart-drawer__cart-button-wrap">
                <Link href="/cart" className="cart-drawer__primary-cta" onClick={closeCart}>
                  View Cart · {formatMoney(subtotal)}
                </Link>
              </div>

              <div className="cart-drawer__lines">
                {lines.map((line) => (
                  <article key={line.id} className="cart-line">
                    <Link href={`/products/${line.productHandle}`} onClick={closeCart} className="cart-line__image-link">
                      {line.image ? <img src={line.image} alt={line.productTitle} className="cart-line__image" /> : null}
                    </Link>
                    <div className="cart-line__content">
                      <div>
                        <p className="cart-line__title">
                          <Link href={`/products/${line.productHandle}`} onClick={closeCart} className="cart-line__title-link">
                            {line.productTitle}
                          </Link>
                        </p>
                        {line.variantTitle ? (
                          <p className="cart-line__variant">{line.variantTitle}</p>
                        ) : null}
                      </div>
                      <p className="cart-line__price">{formatMoney(line.price)}</p>
                      <div className="cart-line__controls">
                        <button type="button" onClick={() => updateQuantity(line.id, line.quantity - 1)}>
                          −
                        </button>
                        <span>{line.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(line.id, line.quantity + 1)}>
                          +
                        </button>
                        <button type="button" className="cart-line__remove" onClick={() => removeLine(line.id)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="cart-drawer__upsell">
            <h3>Frequently bought together</h3>
            <div className="cart-drawer__upsell-list">
              {visibleUpsells.map((item) => (
                <article key={item.handle} className="cart-drawer__upsell-item">
                  <Link href={`/products/${item.handle}`} onClick={closeCart} className="cart-drawer__upsell-image-wrap">
                    <img src={item.image} alt={item.title} className="cart-drawer__upsell-image" />
                  </Link>

                  <div className="cart-drawer__upsell-content">
                    <Link href={`/products/${item.handle}`} onClick={closeCart} className="cart-drawer__upsell-title">
                      {item.title}
                    </Link>
                    <p className="cart-drawer__upsell-price">{formatMoney(item.price)}</p>

                    <label className="cart-drawer__subscription-option">
                      <input
                        type="checkbox"
                        checked={Boolean(subscriptionUpsells[item.handle])}
                        onChange={() => toggleUpsell(item.handle)}
                      />
                      <span className="cart-drawer__subscription-box" aria-hidden="true" />
                      <span>Upgrade to Subscription and Save 5%</span>
                    </label>

                    <button
                      type="button"
                      className="cart-drawer__upsell-button"
                      onClick={() => addUpsell(item)}
                    >
                      Add to Cart
                    </button>
                  </div>
                </article>
              ))}
              {visibleUpsells.length === 0 ? (
                <p className="cart-drawer__upsell-empty">
                  You already have all of our favorite pairings in your cart.
                </p>
              ) : null}
            </div>
          </section>

          <section className="cart-drawer__trust-markers" aria-label="Cart trust markers">
            {TRUST_MARKERS.map((item) => (
              <div key={item.label} className="cart-drawer__trust-item">
                <TrustIcon type={item.icon} />
                <p>{item.label}</p>
              </div>
            ))}
          </section>
        </div>
      </aside>
    </div>
  );
}
