import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { CollectionProductCard } from "@/components/collection-product-card";
import { CollectionSort } from "@/components/collection-sort";
import { getCollectionByHandle, getProductsForCollection, sortProducts } from "@/lib/storefront";
import type { Collection } from "@/lib/types";

type Params = Promise<{ collectionHandle: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const BENEFIT_COLLECTION_HANDLES = [
  "daily-health-longevity",
  "brain-heart-health",
  "energy-stress-support",
  "muscle-performance-recovery",
  "nutritional-support",
  "gut-immune-support",
  "hair-and-skin-care"
] as const;

const SORT_OPTIONS = [
  { value: "featured", label: "Most Popular" },
  { value: "newest", label: "Newest" },
  { value: "price-desc", label: "Price, high-low" },
  { value: "price-asc", label: "Price, low-high" }
] as const;

export default async function CollectionRoute({
  params,
  searchParams
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { collectionHandle } = await params;
  const queryParams = await searchParams;
  const sort = typeof queryParams.sort === "string" ? queryParams.sort : "featured";

  const collection = getCollectionByHandle(collectionHandle);
  if (!collection) {
    notFound();
  }

  const benefitCollections = BENEFIT_COLLECTION_HANDLES.map((handle) => getCollectionByHandle(handle)).filter(
    (item): item is Collection => Boolean(item)
  );
  const products = sortProducts(getProductsForCollection(collectionHandle), sort);
  const activeSortLabel = SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "Most Popular";
  const promoInsertIndex = Math.min(3, products.length);

  return (
    <section className="shell page-section collection-page">
      <div className="collection-page__header">
        <div className="collection-page__intro">
          <h1 className="collection-page__title">{collection.title}</h1>
          <p className="collection-page__description">
            {collection.description || "Explore Bryan Johnson's longevity protocols in this collection."}
          </p>
        </div>

        <CollectionSort
          collectionHandle={collectionHandle}
          activeSort={sort}
          activeSortLabel={activeSortLabel}
          options={SORT_OPTIONS}
        />
      </div>

      <div className="collection-page__layout">
        <aside className="collection-sidebar">
          <div className="collection-filter">
            <div className="collection-filter__heading">
              <h2>Shop by Benefit</h2>
            </div>

            <div className="collection-filter__options">
              {benefitCollections.map((benefitCollection) => {
                const isActive = benefitCollection.handle === collectionHandle;

                return (
                  <Link
                    key={benefitCollection.handle}
                    href={`/collections/${benefitCollection.handle}`}
                    className={`collection-filter__option ${isActive ? "is-active" : ""}`}
                  >
                    <span className={`collection-filter__checkbox ${isActive ? "is-active" : ""}`} />
                    <span>{benefitCollection.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>

        <div className="collection-page__products">
          <div className="collection-products-grid">
            {products.map((product, index) => (
              <FragmentWithPromo
                key={product.handle}
                index={index}
                promoInsertIndex={promoInsertIndex}
                productCard={<CollectionProductCard product={product} />}
              />
            ))}
            {products.length > 0 && promoInsertIndex === products.length ? <BuildYourStackPromoCard /> : null}
          </div>

          {!products.length ? (
            <div className="search-empty collection-page__empty">
              <h2>No products found in this collection.</h2>
              <p>Try another category or browse all products instead.</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function FragmentWithPromo({
  index,
  promoInsertIndex,
  productCard
}: {
  index: number;
  promoInsertIndex: number;
  productCard: ReactNode;
}) {
  return (
    <>
      {index === promoInsertIndex ? <BuildYourStackPromoCard /> : null}
      {productCard}
    </>
  );
}

function BuildYourStackPromoCard() {
  return (
    <Link href="/pages/build-my-stack" className="collection-promo-card">
      <div className="collection-promo-card__inner">
        <h2>Build your longevity stack</h2>
        <p>Save when you subscribe to your custom protocol.</p>
        <span className="collection-promo-card__button">Build your stack</span>
      </div>
    </Link>
  );
}
