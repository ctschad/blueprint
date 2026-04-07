import { ProductCard } from "@/components/product-card";
import { searchProducts, sortProducts } from "@/lib/storefront";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SearchPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const sort = typeof params.sort === "string" ? params.sort : "featured";
  const results = sortProducts(searchProducts(query), sort);

  return (
    <section className="shell page-section">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Search</p>
          <h1>Find a product</h1>
        </div>
        <p className="section-copy">Search by product, benefit, or ingredient.</p>
      </div>

      <form action="/search" className="catalog-toolbar">
        <label className="field field--inline">
          <span>Query</span>
          <input name="q" defaultValue={query} placeholder="olive oil, protein, cognition..." />
        </label>
        <label className="field field--inline">
          <span>Sort</span>
          <select name="sort" defaultValue={sort}>
            <option value="featured">Featured</option>
            <option value="rating">Top rated</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="title">Alphabetical</option>
          </select>
        </label>
        <button type="submit" className="button button--solid">
          Search
        </button>
      </form>

      <p className="catalog-count">
        {query ? `Results for “${query}”` : "Showing the full catalog"} · {results.length} products
      </p>

      {results.length ? (
        <div className="product-grid">
          {results.map((product) => (
            <ProductCard key={product.handle} product={product} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No products matched that search.</h2>
          <p>Try a different term or browse the collections directly.</p>
        </div>
      )}
    </section>
  );
}
