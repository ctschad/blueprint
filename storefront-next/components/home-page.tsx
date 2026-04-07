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
        <div className="shell hero__grid">
          <div className="hero__copy">
            <p className="eyebrow">{homeContent.hero.eyebrow}</p>
            <h1>{homeContent.hero.title}</h1>
            <p>{homeContent.hero.description}</p>
            <div className="hero__actions">
              <Link href="/collections/all-products" className="button button--solid">
                Shop all products
              </Link>
              <Link href="/search" className="button button--ghost">
                Search the catalog
              </Link>
            </div>
          </div>

          <div className="hero__stats">
            {homeContent.stats.map((stat) => (
              <div key={stat.label} className="stat-card">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
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

      <section className="shell page-section page-section--split">
        <div className="surface-card surface-card--image">
          <img
            src="https://blueprint.bryanjohnson.com/cdn/shop/files/advanced-antioxidants__pill-transparent--square_4482dc24-e003-4fb9-bc74-9445b663c7ad.png?v=1770224966"
            alt="Advanced Antioxidants visual"
          />
        </div>
        <div className="surface-card">
          <p className="eyebrow">Our Standard</p>
          <h2>What you will not find inside.</h2>
          <div className="flow-grid">
            {homeContent.flowCards.map((card) => (
              <div key={card.title} className="flow-card">
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
