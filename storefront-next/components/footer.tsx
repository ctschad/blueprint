import Link from "next/link";

type FooterLinkItem = {
  href: string;
  label: string;
  external?: boolean;
};

type SocialLinkItem = FooterLinkItem & {
  icon: "x" | "instagram" | "youtube" | "tiktok";
};

const HELPFUL_LINK_COLUMNS: FooterLinkItem[][] = [
  [
    { href: "/collections/all-products", label: "Shop All" },
    { href: "/pages/help-center", label: "Help Center" },
    { href: "https://apply.workable.com/blueprint-bryanjohnson/", label: "Careers", external: true },
    { href: "https://teamblueprint.superfiliate.com/portal", label: "Refer a Friend", external: true }
  ],
  [
    { href: "/pages/accessibility-statement", label: "Accessibility Statement" },
    { href: "/blogs/recipes", label: "Recipes" },
    {
      href: "https://blueprint.bryanjohnson.com/policies/refund-policy",
      label: "Refund Policy",
      external: true
    },
    { href: "https://blueprintbryanjohnson.tmall.hk/", label: "China T-Mall Store", external: true }
  ]
];

const SOCIAL_GROUPS: Array<{ label: string; links: SocialLinkItem[] }> = [
  {
    label: "Blueprint Socials",
    links: [
      { href: "https://x.com/bp_blueprint", label: "X", external: true, icon: "x" },
      {
        href: "https://www.instagram.com/blueprintlongevity/",
        label: "Instagram",
        external: true,
        icon: "instagram"
      }
    ]
  },
  {
    label: "Bryan Johnson Socials",
    links: [
      { href: "https://x.com/bryan_johnson", label: "X", external: true, icon: "x" },
      {
        href: "https://www.youtube.com/@BryanJohnson",
        label: "YouTube",
        external: true,
        icon: "youtube"
      },
      {
        href: "https://www.tiktok.com/@_bryan_johnson_?lang=en",
        label: "TikTok",
        external: true,
        icon: "tiktok"
      },
      {
        href: "https://www.instagram.com/bryanjohnson_/?hl=en",
        label: "Instagram",
        external: true,
        icon: "instagram"
      }
    ]
  }
];

const LEGAL_LINKS: FooterLinkItem[] = [
  {
    href: "https://blueprint.bryanjohnson.com/policies/privacy-policy",
    label: "Privacy Policy",
    external: true
  },
  {
    href: "https://blueprint.bryanjohnson.com/policies/terms-of-service",
    label: "Terms of Service",
    external: true
  }
];

function FooterLink({ item, className }: { item: FooterLinkItem; className?: string }) {
  if (item.external) {
    return (
      <a href={item.href} className={className} target="_blank" rel="noopener noreferrer">
        {item.label}
      </a>
    );
  }

  return (
    <Link href={item.href} className={className}>
      {item.label}
    </Link>
  );
}

function SocialIcon({ icon }: { icon: SocialLinkItem["icon"] }) {
  switch (icon) {
    case "x":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "instagram":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      );
    case "youtube":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      );
  }
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BrandMark() {
  const letters = [
    "B", "L", "U",
    "E", "P", "R",
    "I", "N", "T"
  ];

  return (
    <div className="site-footer__brand-lockup" aria-hidden="true">
      <div className="site-footer__brand-mark">
        {letters.map((letter, index) => (
          <span key={`${letter}-${index}`}>{letter}</span>
        ))}
      </div>
      <span className="site-footer__brand-subtitle">BRYAN JOHNSON</span>
    </div>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="shell site-footer__grid">
        <div className="site-footer__brand">
          <Link href="/" className="site-footer__brand-link" aria-label="Blueprint Bryan Johnson home">
            <BrandMark />
          </Link>
        </div>

        <div className="site-footer__content">
          <div className="site-footer__main">
            <div className="site-footer__nav-section">
              <h2 className="site-footer__section-title">Helpful Links</h2>
              <div className="site-footer__nav-columns">
                {HELPFUL_LINK_COLUMNS.map((column, index) => (
                  <ul key={index} className="site-footer__nav-list">
                    {column.map((item) => (
                      <li key={item.label} className="site-footer__nav-item">
                        <FooterLink item={item} className="site-footer__nav-link" />
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>

            <div className="site-footer__social-section">
              <h2 className="site-footer__section-title">Follow Us</h2>
              <div className="site-footer__social-profiles">
                {SOCIAL_GROUPS.map((group) => (
                  <div key={group.label} className="site-footer__social-profile">
                    <p className="site-footer__social-profile-name">{group.label}</p>
                    <div className="site-footer__social-links">
                      {group.links.map((link) => (
                        <a
                          key={link.label}
                          href={link.href}
                          className="site-footer__social-link"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={link.label}
                        >
                          <SocialIcon icon={link.icon} />
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="site-footer__disclaimer">
            <p>
              * These statements have not been evaluated by the Food and Drug Administration. This
              product is not intended to diagnose, treat, cure, or prevent any disease. Results may vary.
            </p>
            <p>
              This website is provided for educational and informational purposes only and does not
              constitute providing medical advice or professional services. The information provided
              should not be used for diagnosing or treating a health problem or disease, and those
              seeking personal medical advice should consult with a licensed physician.
            </p>
          </div>

          <div className="site-footer__bottom">
            <p className="site-footer__copyright">
              Copyright © {year}{" "}
              <Link href="/" className="site-footer__copyright-link">
                Blueprint Bryan Johnson
              </Link>
            </p>

            <div className="site-footer__legal">
              {LEGAL_LINKS.map((item) => (
                <FooterLink key={item.label} item={item} className="site-footer__legal-link" />
              ))}

              <button type="button" className="site-footer__locale" aria-label="Selected currency and locale">
                <span>United States (USD $)</span>
                <ChevronDownIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
