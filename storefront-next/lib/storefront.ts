import articlesData from "@/data/generated/articles.json";
import blogsData from "@/data/generated/blogs.json";
import collectionsData from "@/data/generated/collections.json";
import manifestData from "@/data/generated/manifest.json";
import pagesData from "@/data/generated/pages.json";
import productsData from "@/data/generated/products.json";
import type {
  Article,
  Blog,
  Collection,
  Manifest,
  Product,
  StaticPage
} from "@/lib/types";

const manifest = manifestData as Manifest;
const products = productsData as Product[];
const collections = collectionsData as Collection[];
const blogs = blogsData as Blog[];
const articles = articlesData as Article[];
const pages = pagesData as StaticPage[];

const productMap = new Map(products.map((product) => [product.handle, product]));
const collectionMap = new Map(collections.map((collection) => [collection.handle, collection]));
const blogMap = new Map(blogs.map((blog) => [blog.handle, blog]));
const pageMap = new Map(pages.map((page) => [page.handle, page]));

export function getManifest() {
  return manifest;
}

export function getAllProducts() {
  return products;
}

export function getAllCollections() {
  return collections;
}

export function getPrimaryCollections() {
  return [
    "all-products",
    "bestsellers",
    "daily-health-longevity",
    "brain-heart-health",
    "energy-stress-support",
    "muscle-performance-recovery",
    "gut-immune-support",
    "hair-and-skin-care"
  ]
    .map((handle) => collectionMap.get(handle))
    .filter((collection): collection is Collection => Boolean(collection));
}

export function getProductByHandle(handle: string) {
  return productMap.get(handle);
}

export function getProductsByHandles(handles: string[]) {
  const seen = new Set<string>();
  return handles
    .map((handle) => productMap.get(handle))
    .filter((product): product is Product => Boolean(product))
    .filter((product) => {
      if (seen.has(product.handle)) {
        return false;
      }
      seen.add(product.handle);
      return true;
    });
}

export function getCollectionByHandle(handle: string) {
  return collectionMap.get(handle);
}

export function getProductsForCollection(handle: string) {
  const collection = collectionMap.get(handle);
  if (!collection) {
    return [];
  }

  const featured = collection.productHandles
    .map((productHandle) => productMap.get(productHandle))
    .filter((product): product is Product => Boolean(product));

  if (featured.length > 0) {
    return featured;
  }

  return products.filter((product) => product.collectionHandles.includes(handle));
}

export function searchProducts(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return products;
  }

  return products.filter((product) => {
    const haystack = [
      product.title,
      product.summary,
      product.keywords,
      product.type,
      product.vendor,
      product.tags.join(" "),
      product.collectionHandles.join(" ")
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}

export function getProductRecommendations(product: Product, limit = 4) {
  const candidates = products.filter((candidate) => candidate.handle !== product.handle);
  const scored = candidates
    .map((candidate) => {
      const sharedCollections = candidate.collectionHandles.filter((handle) =>
        product.collectionHandles.includes(handle)
      ).length;
      const sharedTags = candidate.tags.filter((tag) => product.tags.includes(tag)).length;
      const typeBonus = candidate.type === product.type ? 2 : 0;
      return {
        candidate,
        score: sharedCollections * 4 + sharedTags + typeBonus
      };
    })
    .sort((left, right) => right.score - left.score || left.candidate.title.localeCompare(right.candidate.title));

  const results = scored
    .filter((item) => item.score > 0)
    .slice(0, limit)
    .map((item) => item.candidate);

  if (results.length >= limit) {
    return results;
  }

  const fallback = products
    .filter((candidate) => candidate.handle !== product.handle)
    .filter((candidate) => !results.some((item) => item.handle === candidate.handle))
    .slice(0, limit - results.length);

  return [...results, ...fallback];
}

export function getBlogByHandle(handle: string) {
  return blogMap.get(handle);
}

export function getArticlesForBlog(blogHandle: string) {
  return articles.filter((article) => article.blogHandle === blogHandle);
}

export function getArticle(blogHandle: string, slug: string) {
  return articles.find((article) => article.blogHandle === blogHandle && article.slug === slug);
}

export function getPageByHandle(handle: string) {
  return pageMap.get(handle);
}

export function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(cents / 100);
}

export function cleanRichText(markup: string) {
  return markup
    .replace(/<meta\b[^>]*>/gi, "")
    .replace(/<span>\s*<\/span>/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function sortProducts(productsToSort: Product[], sort: string) {
  const copy = [...productsToSort];
  switch (sort) {
    case "price-asc":
      return copy.sort((left, right) => left.priceMin - right.priceMin);
    case "price-desc":
      return copy.sort((left, right) => right.priceMax - left.priceMax);
    case "title":
      return copy.sort((left, right) => left.title.localeCompare(right.title));
    case "rating":
      return copy.sort((left, right) => (right.rating ?? 0) - (left.rating ?? 0));
    default:
      return copy;
  }
}
