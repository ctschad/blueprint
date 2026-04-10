import { SearchExperience } from "@/components/search-experience";
import { getProductsByHandles, searchCatalog } from "@/lib/storefront";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SearchRoute({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";

  const favorites = getProductsByHandles([
    "longevity-blend-multinutrient-drink-mix-blood-orange-flavor",
    "essentials-capsules",
    "advanced-antioxidants",
    "extra-virgin-olive-oil"
  ]).map((product) => ({
    handle: product.handle,
      title: product.title,
      summary: product.summary,
      keywords: product.keywords,
      vendor: product.vendor,
      priceMin: product.priceMin,
      rating: product.rating ?? null,
      reviewsCount: product.reviewsCount ?? null,
      image: product.images[0]?.src ?? null
    }));

  const initialResults = query.trim() ? searchCatalog(query) : { articles: [], products: [] };

  return (
    <SearchExperience
      initialQuery={query}
      favorites={favorites}
      initialResults={initialResults}
    />
  );
}
