"use client";

import Link from "next/link";
import { useCart } from "@/components/storefront-provider";
import { formatMoney } from "@/lib/storefront";

export function CartDrawer() {
  const { lines, isOpen, closeCart, removeLine, updateQuantity, subtotal } = useCart();

  return (
    <div className={`cart-drawer ${isOpen ? "is-open" : ""}`} aria-hidden={!isOpen}>
      <button type="button" className="cart-drawer__backdrop" onClick={closeCart} />
      <aside className="cart-drawer__panel">
        <div className="cart-drawer__header">
          <div>
            <p className="eyebrow">Cart</p>
            <h2>Your stack</h2>
          </div>
          <button type="button" className="cart-drawer__close" onClick={closeCart}>
            Close
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="cart-drawer__empty">
            <p>Your cart is empty.</p>
            <Link href="/collections/all-products" className="button button--solid" onClick={closeCart}>
              Explore products
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-drawer__lines">
              {lines.map((line) => (
                <div key={line.id} className="cart-line">
                  {line.image ? <img src={line.image} alt={line.productTitle} className="cart-line__image" /> : null}
                  <div className="cart-line__content">
                    <div>
                      <p className="cart-line__title">{line.productTitle}</p>
                      <p className="cart-line__variant">{line.variantTitle}</p>
                    </div>
                    <p className="cart-line__price">{formatMoney(line.price)}</p>
                    <div className="cart-line__controls">
                      <button type="button" onClick={() => updateQuantity(line.id, line.quantity - 1)}>
                        -
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
                </div>
              ))}
            </div>

            <div className="cart-drawer__footer">
              <div className="cart-drawer__subtotal">
                <span>Subtotal</span>
                <strong>{formatMoney(subtotal)}</strong>
              </div>
              <Link href="/cart" className="button button--solid button--full" onClick={closeCart}>
                View cart
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
