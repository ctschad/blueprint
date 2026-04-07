import Link from "next/link";
import { HomeCollectionShowcase } from "@/components/home-collection-showcase";
import { ProductCard } from "@/components/product-card";
import { TestimonialCarousel } from "@/components/testimonial-carousel";
import { homeContent } from "@/lib/home-content";
import { getCollectionByHandle, getProductByHandle, getProductsForCollection } from "@/lib/storefront";

export function HomePage() {
  const collectionTabs = homeContent.collectionTabs
    .map((tab) => {
      const collection = getCollectionByHandle(tab.handle);
      if (!collection) {
        return null;
      }
      return {
        handle: tab.handle,
        label: tab.label,
        description: collection.description || `Explore ${collection.title}.`,
        products: getProductsForCollection(tab.handle)
      };
    })
    .filter((tab): tab is NonNullable<typeof tab> => Boolean(tab));

  const bodyCollections = homeContent.bodyCollections
    .map((handle) => getCollectionByHandle(handle))
    .filter((collection): collection is NonNullable<typeof collection> => Boolean(collection));

  const bestsellers = getProductsForCollection("bestsellers").slice(0, 5);
  const routineProducts = homeContent.routineHandles
    .map((handle) => getProductByHandle(handle))
    .filter((product): product is NonNullable<typeof product> => Boolean(product));

  return (
    <>
      <section className="hero">
        <div className="shell">
          <div className="hero__stage">
            <h1 className="sr-only">{homeContent.hero.heading}</h1>

            <div className="hero__media">
              <img
                src={homeContent.hero.image.src}
                alt={homeContent.hero.image.alt}
                className="hero__media-image"
              />
            </div>

            <div className="hero__cards">
              <div className="hero__card">
                <div className="hero__card-body">
                  <h2 className="hero__card-title">{homeContent.hero.title}</h2>
                  <p className="hero__card-copy">{homeContent.hero.description}</p>
                  <Link href={homeContent.hero.resultsHref} className="hero__results-link">
                    {homeContent.hero.resultsLabel}
                  </Link>
                  <p className="hero__footnote">{homeContent.hero.footnote}</p>
                </div>
              </div>

              <aside className="hero__ingredient-card" aria-label={homeContent.hero.secondaryCard.title}>
                <div className="hero__ingredient-card-body">
                  <h2 className="hero__ingredient-card-title">{homeContent.hero.secondaryCard.title}</h2>
                  <div className="hero__ingredient-list">
                    {homeContent.hero.secondaryCard.items.map((item) => (
                      <div key={item.title} className="hero__ingredient-item">
                        <h3>{item.title}</h3>
                        <p>{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>

      <section className="shell page-section">
        <div className="page-heading">
          <div>
            <p className="eyebrow">Every product is designed for every body</p>
            <h2>Build your routine by category.</h2>
          </div>
          <p className="section-copy">
            Start with daily foundations, then move into more targeted support as your routine evolves.
          </p>
        </div>
        <div className="collection-grid">
          {bodyCollections.map((collection) => (
            <Link key={collection.handle} href={`/collections/${collection.handle}`} className="collection-card">
              {collection.image ? <img src={collection.image} alt={collection.title} className="collection-card__image" /> : null}
              <div className="collection-card__body">
                <p className="eyebrow">Collection</p>
                <h3>{collection.title}</h3>
                <p>{collection.description || "Browse the products in this category."}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <HomeCollectionShowcase tabs={collectionTabs} />

      <section className="shell page-section">
        <TestimonialCarousel items={homeContent.testimonials} />
      </section>

      <section className="shell page-section">
        <div className="page-heading">
          <div>
            <p className="eyebrow">Bestsellers</p>
            <h2>What people reach for first.</h2>
          </div>
          <Link href="/collections/bestsellers" className="button button--ghost">
            View all bestsellers
          </Link>
        </div>
        <div className="product-grid">
          {bestsellers.map((product) => (
            <ProductCard key={product.handle} product={product} />
          ))}
        </div>
      </section>

      <section className="shell page-section">
        <div className="page-heading">
          <div>
            <p className="eyebrow">Excellence. Made effortless.</p>
            <h2>The routine, at a glance.</h2>
          </div>
          <p className="section-copy">
            The products most often used together, all in one place.
          </p>
        </div>
        <div className="product-grid">
          {routineProducts.map((product) => (
            <ProductCard key={product.handle} product={product} />
          ))}
        </div>
      </section>
    </>
  );
}
