import { SearchExperience } from "@/components/search-experience";
import { getAllArticles, getAllProducts, getProductsByHandles } from "@/lib/storefront";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function toPlainText(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export default async function SearchRoute({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";

  const products = getAllProducts().map((product) => ({
    handle: product.handle,
    title: product.title,
    summary: product.summary,
    keywords: product.keywords,
    vendor: product.vendor,
    priceMin: product.priceMin,
    rating: product.rating ?? null,
    reviewsCount: product.reviewsCount ?? null,
    image: product.images[0]?.src ?? null,
    searchText: [
      product.title,
      product.summary,
      product.keywords,
      product.type,
      product.vendor,
      product.tags.join(" "),
      product.collectionHandles.join(" "),
      toPlainText(product.descriptionHtml).slice(0, 900)
    ]
      .join(" ")
      .toLowerCase()
  }));

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
    image: product.images[0]?.src ?? null,
    searchText: [
      product.title,
      product.summary,
      product.keywords,
      product.type,
      product.vendor,
      product.tags.join(" "),
      product.collectionHandles.join(" "),
      toPlainText(product.descriptionHtml).slice(0, 900)
    ]
      .join(" ")
      .toLowerCase()
  }));

  const articles = getAllArticles().map((article) => ({
    href: `/blogs/${article.blogHandle}/${article.slug}`,
    title: article.title,
    image: article.image ?? null,
    searchText: [article.title, article.description, article.tags.join(" "), toPlainText(article.bodyHtml).slice(0, 1200)]
      .join(" ")
      .toLowerCase()
  }));

  return (
    <SearchExperience
      initialQuery={query}
      products={products}
      favorites={favorites}
      articles={articles}
    />
  );
}
