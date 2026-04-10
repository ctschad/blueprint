import Link from "next/link";
import { BestsellersCarousel } from "@/components/bestsellers-carousel";
import { EveryBodyBanner } from "@/components/every-body-banner";
import { HomeCollectionShowcase } from "@/components/home-collection-showcase";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { OptimizedImage } from "@/components/optimized-image";
import { RoutineCarousel } from "@/components/routine-carousel";
import { StandardsFeature } from "@/components/standards-feature";
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

  const bestsellers = getProductsForCollection("bestsellers");
  const routineProducts = homeContent.routineHandles
    .map((handle) => getProductByHandle(handle))
    .filter((product): product is NonNullable<typeof product> => Boolean(product));

  return (
    <>
      <section className="shell home-top-banner">
        <div className="home-top-banner__inner">
          <OptimizedImage
            src={homeContent.topBanner.image.src}
            alt={homeContent.topBanner.image.alt}
            className="home-top-banner__image"
            sizes="100vw"
            priority
          />
          <div className="home-top-banner__overlay" />
          <div className="home-top-banner__content">
            <h2>{homeContent.topBanner.title}</h2>
            <p>{homeContent.topBanner.description}</p>
            <Link href={homeContent.topBanner.ctaHref} className="button button--solid home-top-banner__cta">
              {homeContent.topBanner.ctaLabel}
            </Link>
          </div>
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
        <RoutineCarousel products={routineProducts} />
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
              {collection.image ? (
                <OptimizedImage
                  src={collection.image}
                  alt={collection.title}
                  className="collection-card__image"
                  sizes="(min-width: 1200px) 24vw, (min-width: 768px) 33vw, 85vw"
                />
              ) : null}
              <div className="collection-card__body">
                <h3>{collection.title}</h3>
                <p>{collection.description || "Browse the products in this category."}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="shell page-section page-section--bestsellers-top">
        <div className="page-heading">
          <div>
            <p className="eyebrow">Bestsellers</p>
            <h2>What people reach for first.</h2>
          </div>
          <Link href="/collections/bestsellers" className="button button--ghost">
            View all bestsellers
          </Link>
        </div>
        <BestsellersCarousel products={bestsellers} />
      </section>

      <EveryBodyBanner content={homeContent.everyBodyBanner} />

      <HomeCollectionShowcase tabs={collectionTabs} />

      <StandardsFeature content={homeContent.hero} />

      <NewsletterSignup content={homeContent.newsletter} />

      <section className="shell page-section">
        <TestimonialCarousel items={homeContent.testimonials} />
      </section>
    </>
  );
}
