"use client";

import { HeaderBenefitMenu } from "@/components/header-benefit-menu";
import { HeroCategoryMenu } from "@/components/hero-category-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAccount, useCart } from "@/components/storefront-provider";

const NAV_LINKS = [
  { href: "/pages/build-my-stack", label: "Build my Stack", match: "/pages/build-my-stack" },
  { href: "/blogs/news", label: "Learn", match: "/blogs" }
];

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { itemCount, openCart } = useCart();
  const { profile } = useAccount();

  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <div className="site-header__brand">
          <button
            type="button"
            className="site-header__menu"
            onClick={() => setMenuOpen((current) => !current)}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
          >
            Browse
          </button>
          <Link href="/" className="site-header__logo">
            <span className="site-header__logo-wordmark">Blueprint</span>
            <span className="site-header__logo-caption">By Bryan Johnson</span>
          </Link>
        </div>

        <nav className={`site-header__nav ${menuOpen ? "is-open" : ""}`}>
          <HeroCategoryMenu variant="header" />
          <HeaderBenefitMenu />
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname.startsWith(link.match) ? "is-active" : ""}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/pages/protocol-quiz" className="site-header__quiz-link" onClick={() => setMenuOpen(false)}>
            Take the Quiz
          </Link>
        </nav>

        <div className="site-header__actions">
          <Link href="/search" className="site-header__action-link">
            Search
          </Link>
          <Link href="/account" className="site-header__action-link">
            {profile.signedIn ? profile.name.split(" ")[0] : "Account"}
          </Link>
          <button type="button" className="site-header__cart" onClick={openCart}>
            Cart
            <span>{itemCount}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
