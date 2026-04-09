"use client";

import Link from "next/link";
import { useCart } from "@/components/storefront-provider";
import { formatMoney } from "@/lib/money";

const SUBSCRIPTION_INELIGIBLE_HANDLES = new Set(["laser-cap"]);

export function CartPageView() {
  const { lines, subtotal, updateQuantity, removeLine, toggleSubscription } = useCart();

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
      </div>

      <div className="cart-page">
        <div className="cart-page__list">
          {lines.map((line) => (
            <article key={line.id} className="cart-page__line">
              <div className="cart-page__media">
                <Link href={`/products/${line.productHandle}`} className="cart-page__image-link">
                  {line.image ? <img src={line.image} alt={line.productTitle} className="cart-page__image" /> : null}
                </Link>
                <p className="cart-page__price">{formatMoney(line.price)}</p>
              </div>
              <div className="cart-page__content">
                <div className="cart-page__copy">
                  <h2>{line.productTitle}</h2>
                  {line.variantTitle ? <p className="cart-page__variant">{line.variantTitle}</p> : null}
                  {!SUBSCRIPTION_INELIGIBLE_HANDLES.has(line.productHandle) ? (
                    <label className="cart-page__subscription-option">
                      <input
                        type="checkbox"
                        checked={Boolean(line.isSubscription)}
                        onChange={() => toggleSubscription(line.id)}
                      />
                      <span className="cart-page__subscription-box" aria-hidden="true" />
                      <span>Subscribe and save 5%</span>
                    </label>
                  ) : null}
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
                  <button type="button" className="button button--ghost cart-page__remove" onClick={() => removeLine(line.id)}>
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="cart-page__summary">
          <div className="cart-page__summary-header">
            <div>
              <p className="eyebrow">Summary</p>
              <h2>{formatMoney(subtotal)}</h2>
            </div>
          </div>
          <p>Shipping and taxes are calculated at checkout. Checkout is unavailable in this preview.</p>
          <button type="button" className="button button--solid button--full" disabled>
            Checkout unavailable
          </button>
        </aside>
      </div>
    </section>
  );
}
