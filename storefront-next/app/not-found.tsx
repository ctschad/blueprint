import Link from "next/link";

export default function NotFound() {
  return (
    <section className="shell page-section">
      <p className="eyebrow">Not found</p>
      <h1>We couldn&apos;t find that page.</h1>
      <p>Try the homepage or browse the full product catalog.</p>
      <div className="hero__actions">
        <Link href="/" className="button button--solid">
          Homepage
        </Link>
        <Link href="/collections/all-products" className="button button--ghost">
          All products
        </Link>
      </div>
    </section>
  );
}
