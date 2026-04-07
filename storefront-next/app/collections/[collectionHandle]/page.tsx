import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { getCollectionByHandle, getProductsForCollection, sortProducts } from "@/lib/storefront";

type Params = Promise<{ collectionHandle: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CollectionPage({
  params,
  searchParams
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { collectionHandle } = await params;
  const queryParams = await searchParams;
  const query = typeof queryParams.q === "string" ? queryParams.q : "";
  const sort = typeof queryParams.sort === "string" ? queryParams.sort : "featured";

  const collection = getCollectionByHandle(collectionHandle);
  if (!collection) {
    notFound();
  }

  let products = getProductsForCollection(collectionHandle);
  if (query) {
    const normalized = query.toLowerCase();
    products = products.filter((product) =>
      [product.title, product.summary, product.keywords, product.tags.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }
  products = sortProducts(products, sort);

  return (
    <section className="shell page-section">
      <div className="collection-hero">
        <div className="page-heading">
          <div>
            <p className="eyebrow">Collection</p>
            <h1>{collection.title}</h1>
          </div>
          <p className="section-copy section-copy--narrow">
            {collection.description || "Explore everything in this collection."}
          </p>
        </div>
        {collection.image ? <img src={collection.image} alt={collection.title} className="collection-hero__image" /> : null}
      </div>

      <form action={`/collections/${collectionHandle}`} className="catalog-toolbar">
        <label className="field field--inline">
          <span>Search within collection</span>
          <input name="q" defaultValue={query} placeholder="filter products" />
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
          Apply
        </button>
      </form>

      <p className="catalog-count">{products.length} products</p>

      {products.length ? (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.handle} product={product} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No products found in this collection.</h2>
          <p>Try a different query or return to the full catalog.</p>
        </div>
      )}
    </section>
  );
}
