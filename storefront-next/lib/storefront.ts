import articlesData from "@/data/generated/articles.json";
import blogsData from "@/data/generated/blogs.json";
import collectionsData from "@/data/generated/collections.json";
import manifestData from "@/data/generated/manifest.json";
import pagesData from "@/data/generated/pages.json";
import productsData from "@/data/generated/products.json";
import type {
  Article,
  Blog,
  CoaCategory,
  CoaEntry,
  CoaFaq,
  CoaPageData,
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

export function getAllArticles() {
  return articles;
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
  const page = pageMap.get(handle);

  if (!page) {
    return undefined;
  }

  return {
    ...page,
    image: page.image ? normalizeLocalAssetHref(page.image) : page.image,
    bodyHtml: normalizeLocalAssetMarkup(page.bodyHtml)
  };
}

function stripTags(markup: string) {
  return markup.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function normalizeLegacyProductHref(href: string) {
  const rawHandle = href.split("/products/").pop() ?? href;
  const handle = rawHandle.replace(/__q_[^/?#]+/, "");
  return {
    handle,
    href: `/products/${handle}`
  };
}

function normalizeLocalAssetHref(href: string) {
  if (href.startsWith("/")) {
    return href;
  }

  if (href.startsWith("https://blueprint.bryanjohnson.com/")) {
    return href.replace("https://blueprint.bryanjohnson.com", "");
  }

  if (href.startsWith("https://cdn.shopify.com/s/files/1/0772/3129/2701/files/")) {
    return href.replace("https://cdn.shopify.com/s/files/1/0772/3129/2701/files", "/cdn/shop/files");
  }

  return href;
}

function normalizeLocalAssetMarkup(markup: string) {
  return markup
    .replaceAll("https://blueprint.bryanjohnson.com/cdn/shop/files", "/cdn/shop/files")
    .replaceAll("https://cdn.shopify.com/s/files/1/0772/3129/2701/files", "/cdn/shop/files");
}

function inferCoaCategory(product?: Product): Exclude<CoaCategory, "all"> {
  const handles = product?.collectionHandles ?? [];

  if (handles.includes("haircare")) {
    return "haircare";
  }

  if (handles.includes("skincare")) {
    return "skincare";
  }

  if (handles.includes("supplements")) {
    return "supplements";
  }

  return "nutrition";
}

function parseCoaEntries(markup: string): CoaEntry[] {
  const pattern =
    /class="card-product[\s\S]*?href="([^"]+)"[\s\S]*?<img\s+[^>]*src="([^"]+)"[\s\S]*?class="x-card-title[^"]*"[^>]*>\s*([\s\S]*?)\s*<\/a>[\s\S]*?class="coa-badges__link" href="([^"]+)"[\s\S]*?>\s*Download Full Report\s*<\/a>[\s\S]*?class="x-card-price[^"]*">\s*(\$[0-9.,]+)/g;

  const items: CoaEntry[] = [];

  for (const match of markup.matchAll(pattern)) {
    const href = match[1];
    const image = match[2];
    const titleMarkup = match[3];
    const reportHref = match[4];
    const priceLabel = match[5];

    if (!href || !image || !titleMarkup || !reportHref || !priceLabel) {
      continue;
    }

    const title = decodeHtmlEntities(stripTags(titleMarkup));
    const normalized = normalizeLegacyProductHref(href);
    const product = productMap.get(normalized.handle);

    items.push({
      title,
      href: normalized.href,
      image,
      reportHref: normalizeLocalAssetHref(reportHref),
      priceLabel,
      category: inferCoaCategory(product)
    });
  }

  return items;
}

function parseCoaFaqs(markup: string): CoaFaq[] {
  const pattern =
    /<span class="faq-accordion__question-text">([\s\S]*?)<\/span>[\s\S]*?<div class="faq-accordion__answer"[^>]*>([\s\S]*?)<\/div>/g;

  return Array.from(markup.matchAll(pattern))
    .map((match) => {
      const question = match[1] ? decodeHtmlEntities(stripTags(match[1])) : "";
      const answerHtml = match[2]?.trim() ?? "";
      return {
        question,
        answerHtml
      };
    })
    .filter((item) => item.question && item.answerHtml);
}

export function getCoaPageData(): CoaPageData | null {
  const page = pageMap.get("coas");
  if (!page) {
    return null;
  }

  const heroTitleMatch = page.bodyHtml.match(/<h1[^>]*>\s*([\s\S]*?)\s*<\/h1>/);
  const heroDescriptionMatch = page.bodyHtml.match(
    /<p class="content-text-image_banner_QRChyr[^"]*">\s*([\s\S]*?)\s*<\/p>/
  );
  const desktopImageMatch = page.bodyHtml.match(
    /src="(\/cdn\/shop\/files\/page-banner__coa--desktop[^"]+)"/
  );
  const mobileImageMatch = page.bodyHtml.match(
    /srcset="(\/cdn\/shop\/files\/page-banner__coa--mobile[^"\s]+)/
  );

  const entries = parseCoaEntries(page.bodyHtml);
  const faqs = parseCoaFaqs(page.bodyHtml);

  if (!heroTitleMatch || !heroDescriptionMatch || !desktopImageMatch || entries.length === 0) {
    return null;
  }

  return {
    heroTitle: decodeHtmlEntities(stripTags(heroTitleMatch[1])),
    heroDescription: decodeHtmlEntities(stripTags(heroDescriptionMatch[1])),
    heroDesktopImage: desktopImageMatch[1],
    heroMobileImage: mobileImageMatch?.[1] ?? desktopImageMatch[1],
    entries,
    faqs
  };
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
    case "newest":
      return copy.sort((left, right) => right.id - left.id);
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
