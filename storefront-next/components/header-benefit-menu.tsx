"use client";

import Link from "next/link";
import type { FocusEvent, ReactNode } from "react";
import { useState } from "react";
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

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setOpen(false);
    }
  };

  return (
    <div
      className={`hero-category-menu hero-category-menu--header hero-category-menu--benefit ${open ? "is-open" : ""}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlur={handleBlur}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
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
        onClick={() => setOpen((current) => !current)}
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
                  <img src={card.image} alt={card.alt} className="hero-category-menu__feature-image" />
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
