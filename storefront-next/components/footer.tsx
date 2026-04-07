import Link from "next/link";

const FOOTER_COLLECTIONS = [
  { href: "/collections/all-products", label: "All Products" },
  { href: "/collections/bestsellers", label: "Bestsellers" },
  { href: "/collections/daily-health-longevity", label: "Daily Health & Longevity" },
  { href: "/collections/essentials-stack", label: "Stacks" }
];

const FOOTER_CONTENT = [
  { href: "/pages/about", label: "About" },
  { href: "/pages/blueprint-protocol", label: "Blueprint Protocol" },
  { href: "/blogs/news", label: "Journal" },
  { href: "/pages/help-center", label: "Help Center" }
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell site-footer__grid">
        <div>
          <p className="footer-kicker">Blueprint</p>
          <h2>Engineered for longevity. Simple enough for every day.</h2>
          <p className="site-footer__intro">
            Daily essentials, targeted formulas, and a journal built around measurable health.
          </p>
        </div>

        <div>
          <h3>Shop</h3>
          <ul>
            {FOOTER_COLLECTIONS.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3>Explore</h3>
          <ul>
            {FOOTER_CONTENT.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
