"use client";

import Link from "next/link";
import type { FocusEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { OptimizedImage } from "@/components/optimized-image";
import { shopByBenefitMenu } from "@/lib/home-content";

type MenuLink = {
  href: string;
  label?: string;
  title?: string;
  external?: boolean;
};

function NavLink({
  item,
  className,
  onClick,
  children
}: {
  item: MenuLink;
  className?: string;
  onClick?: () => void;
  children?: ReactNode;
}) {
  const label = item.label ?? item.title ?? "";

  if (item.external) {
    return (
      <a href={item.href} className={className} onClick={onClick}>
        {children ?? label}
      </a>
    );
  }

  return (
    <Link href={item.href} className={className} onClick={onClick}>
      {children ?? label}
    </Link>
  );
}

export function HeaderBenefitMenu() {
  const [open, setOpen] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const closeSoon = () => {
    clearCloseTimeout();
    closeTimeoutRef.current = window.setTimeout(() => {
      setOpen(false);
      closeTimeoutRef.current = null;
    }, 220);
  };

  useEffect(() => {
    return () => {
      clearCloseTimeout();
    };
  }, []);

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      clearCloseTimeout();
      setOpen(false);
    }
  };

  return (
    <div
      className={`hero-category-menu hero-category-menu--header hero-category-menu--benefit ${open ? "is-open" : ""}`}
      onMouseEnter={() => {
        clearCloseTimeout();
        setOpen(true);
      }}
      onMouseLeave={closeSoon}
      onFocusCapture={() => {
        clearCloseTimeout();
        setOpen(true);
      }}
      onBlur={handleBlur}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          clearCloseTimeout();
          setOpen(false);
          (event.currentTarget.querySelector("button") as HTMLButtonElement | null)?.focus();
        }
      }}
    >
      <button
        type="button"
        className="hero-category-menu__trigger site-header__nav-link-button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => {
          clearCloseTimeout();
          setOpen((current) => !current);
        }}
      >
        Shop by Benefit
        <span className="hero-category-menu__chevron" aria-hidden="true">
          ▾
        </span>
      </button>

      <div className="hero-category-menu__panel" aria-hidden={!open}>
        <div className="hero-category-menu__layout shell">
          <div className="hero-category-menu__quick-links">
            {shopByBenefitMenu.quickLinks.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                className="hero-category-menu__quick-link"
                onClick={() => setOpen(false)}
              />
            ))}
          </div>

          <div className="hero-category-menu__groups">
            <div className="hero-category-menu__columns">
              <div className="hero-category-menu__column">
                <div className="hero-category-menu__section">
                  <p className="hero-category-menu__section-title">{shopByBenefitMenu.title}</p>
                  <div className="hero-category-menu__lines">
                    {shopByBenefitMenu.items.map((item) => (
                      <NavLink
                        key={item.href}
                        item={item}
                        className="hero-category-menu__line"
                        onClick={() => setOpen(false)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-category-menu__features">
            {shopByBenefitMenu.featureCards.map((card) => (
              <div key={card.title} className="hero-category-menu__feature-card">
                <NavLink item={card} className="hero-category-menu__feature-image-link" onClick={() => setOpen(false)}>
                  <OptimizedImage
                    src={card.image}
                    alt={card.alt}
                    className="hero-category-menu__feature-image"
                    sizes="20rem"
                  />
                </NavLink>
                <NavLink item={card} className="hero-category-menu__feature-link" onClick={() => setOpen(false)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
