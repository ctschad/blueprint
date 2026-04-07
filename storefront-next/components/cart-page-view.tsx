"use client";

import Link from "next/link";
import { useCart } from "@/components/storefront-provider";
import { formatMoney } from "@/lib/storefront";

export function CartPageView() {
  const { lines, subtotal, updateQuantity, removeLine, clearCart } = useCart();

  if (lines.length === 0) {
    return (
      <section className="shell page-section">
        <p className="eyebrow">Cart</p>
        <h1>Your cart is empty.</h1>
        <p>Add products to build your daily stack.</p>
        <Link href="/collections/all-products" className="button button--solid">
          Shop all products
        </Link>
      </section>
    );
  }

  return (
    <section className="shell page-section">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Cart</p>
          <h1>Your cart</h1>
        </div>
        <button type="button" className="button button--ghost" onClick={clearCart}>
          Clear cart
        </button>
      </div>

      <div className="cart-page">
        <div className="cart-page__list">
          {lines.map((line) => (
            <article key={line.id} className="cart-page__line">
              {line.image ? <img src={line.image} alt={line.productTitle} className="cart-page__image" /> : null}
              <div className="cart-page__content">
                <h2>{line.productTitle}</h2>
                <p>{line.variantTitle}</p>
                <p>{formatMoney(line.price)}</p>
              </div>
              <div className="cart-page__actions">
                <div className="stepper">
                  <button type="button" onClick={() => updateQuantity(line.id, line.quantity - 1)}>
                    -
                  </button>
                  <span>{line.quantity}</span>
                  <button type="button" onClick={() => updateQuantity(line.id, line.quantity + 1)}>
                    +
                  </button>
                </div>
                <button type="button" className="button button--ghost" onClick={() => removeLine(line.id)}>
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>

        <aside className="cart-page__summary">
          <p className="eyebrow">Summary</p>
          <h2>{formatMoney(subtotal)}</h2>
          <p>Shipping and taxes are calculated at checkout. Checkout is unavailable in this preview.</p>
          <button type="button" className="button button--solid button--full" disabled>
            Checkout unavailable
          </button>
        </aside>
      </div>
    </section>
  );
}
