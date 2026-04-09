import fs from "fs";
import path from "path";
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
const hiddenMarketCollectionHandles = new Set([
  "bc-market-bc-cz-dk-fi-ie-it-no-pl-se",
  "market-bc",
  "market-cz",
  "market-dk",
  "market-fi",
  "market-ie",
  "market-it",
  "market-no",
  "market-pl",
  "market-se"
]);

function sanitizeProduct(product: Product): Product {
  return {
    ...product,
    collectionHandles: product.collectionHandles.filter((handle) => !hiddenMarketCollectionHandles.has(handle))
  };
}

const products = (productsData as Product[]).map(sanitizeProduct);
const collections = collectionsData as Collection[];
const blogs = blogsData as Blog[];
const pages = pagesData as StaticPage[];

const productMap = new Map(products.map((product) => [product.handle, product]));
const collectionMap = new Map(collections.map((collection) => [collection.handle, collection]));
const blogMap = new Map(blogs.map((blog) => [blog.handle, blog]));
const pageMap = new Map(pages.map((page) => [page.handle, page]));
const articlePlaceholderImage = "/cdn/shop/files/placeholder-2_385x215_crop_center__q_526e273fc83f.png";
const articlePublicAssetDirectory = path.join(process.cwd(), "public", "cdn", "shop", "articles");
const articlePublicAssetFiles = new Set(
  fs.existsSync(articlePublicAssetDirectory) ? fs.readdirSync(articlePublicAssetDirectory) : []
);
const filePublicAssetDirectory = path.join(process.cwd(), "public", "cdn", "shop", "files");
const filePublicAssetFiles = new Set(
  fs.existsSync(filePublicAssetDirectory) ? fs.readdirSync(filePublicAssetDirectory) : []
);
const articleAssetCandidates = Array.from(
  new Set(
    (articlesData as Article[]).flatMap((article) => [
      article.image,
      ...article.relatedArticles.map((item) => item.image)
    ])
  )
).filter((image): image is string => Boolean(image && image.startsWith("/cdn/shop/articles/")));

function resolveLocalArticleAssetHref(href: string) {
  const normalizedHref = href
    .replace("https://blueprint.bryanjohnson.com", "")
    .replace(/\?.*$/, "");

  if (!normalizedHref.startsWith("/cdn/shop/articles/")) {
    return normalizedHref;
  }

  const fileName = normalizedHref.split("/").pop() ?? "";
  if (!fileName) {
    return normalizedHref;
  }

  if (articlePublicAssetFiles.has(fileName)) {
    return normalizedHref;
  }

  const extensionIndex = fileName.lastIndexOf(".");
  const rawStem = extensionIndex >= 0 ? fileName.slice(0, extensionIndex) : fileName;
  const rawExtension = extensionIndex >= 0 ? fileName.slice(extensionIndex + 1) : "";

  const diskMatch = Array.from(articlePublicAssetFiles).find((candidateFileName) => {
    return (
      candidateFileName.startsWith(`${rawStem}__q_`) &&
      (!rawExtension || candidateFileName.endsWith(`.${rawExtension}`))
    );
  });

  if (diskMatch) {
    return `/cdn/shop/articles/${diskMatch}`;
  }

  const localMatch = articleAssetCandidates.find((candidate) => {
    const candidateFileName = candidate.split("/").pop() ?? "";
    return (
      candidateFileName.startsWith(`${rawStem}__q_`) &&
      (!rawExtension || candidateFileName.endsWith(`.${rawExtension}`))
    );
  });

  return localMatch ?? normalizedHref;
}

function normalizeArticleAssetHref(href: string) {
  if (href.startsWith("https://blueprint.bryanjohnson.com/cdn/shop/articles/") || href.startsWith("/cdn/shop/articles/")) {
    return resolveLocalArticleAssetHref(href);
  }

  if (
    href.startsWith("https://blueprint.bryanjohnson.com/cdn/shop/files") ||
    href.startsWith("https://cdn.shopify.com/s/files/1/0772/3129/2701/files")
  ) {
    return normalizeLocalAssetHref(href);
  }

  return href;
}

function extractFirstImageFromMarkup(markup: string) {
  const match = markup.match(/<img[^>]+src="([^"]+)"/i);
  return match?.[1] ? normalizeArticleAssetHref(match[1]) : null;
}

function normalizeInstagramEmbeds(markup: string) {
  const buildInstagramEmbed = (href: string) => `
    <section class="article-embed article-embed--instagram">
      <p class="article-embed__eyebrow">Instagram Post</p>
      <h2 class="article-embed__title">View the original post</h2>
      <p class="article-embed__copy">This story is published as an Instagram post. Open it on Instagram to see the full reel and caption.</p>
      <a class="button button--solid article-embed__button" href="${href}" target="_blank" rel="noopener noreferrer">Open on Instagram</a>
    </section>
  `.trim();

  const withoutScripts = markup.replace(
    /<script[^>]*src=["'](?:https?:)?\/\/www\.instagram\.com\/embed\.js[^>]*><\/script>/gi,
    ""
  );

  const normalizedEmbeds = withoutScripts.replace(
    /<blockquote[^>]*class="instagram-media"[^>]*data-instgrm-permalink="([^"]+)"[^>]*>[\s\S]*?<\/blockquote>/gi,
    (_match, permalink: string) => {
      const href = decodeHtmlEntities(permalink);
      return buildInstagramEmbed(href);
    }
  );

  if (/instagram-media/i.test(normalizedEmbeds) && !/<\/blockquote>/i.test(normalizedEmbeds)) {
    const permalinkMatch = normalizedEmbeds.match(/data-instgrm-permalink="([^"]+)"/i);
    if (permalinkMatch?.[1]) {
      return buildInstagramEmbed(decodeHtmlEntities(permalinkMatch[1]));
    }
  }

  return normalizedEmbeds;
}

function summarizeText(value: string, maxLength = 180) {
  const plainText = value.replace(/\s+/g, " ").trim();
  if (!plainText) {
    return "";
  }

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return `${plainText.slice(0, maxLength).trimEnd()}…`;
}

function sanitizeArticle(article: Article): Article {
  const bodyHtml = normalizeLocalAssetMarkup(normalizeInstagramEmbeds(article.bodyHtml));
  const fallbackDescription = summarizeText(stripTags(bodyHtml), 180);
  const descriptionSource = article.description.trim() || fallbackDescription;
  const description = descriptionSource.startsWith("View this post on Instagram")
    ? "Open the original Instagram post to view the full reel and caption."
    : descriptionSource;
  const image = article.image
    ? normalizeArticleAssetHref(article.image)
    : extractFirstImageFromMarkup(bodyHtml) ?? articlePlaceholderImage;

  return {
    ...article,
    image,
    description,
    bodyHtml,
    relatedArticles: article.relatedArticles.map((item) => ({
      ...item,
      image: item.image ? normalizeArticleAssetHref(item.image) : item.image
    }))
  };
}

const articles = (articlesData as Article[]).map(sanitizeArticle);

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

function resolveLocalFileAssetHref(href: string) {
  const normalizedHref = href.replace(/\?.*$/, "");
  let localHref = normalizedHref;

  if (normalizedHref.startsWith("https://blueprint.bryanjohnson.com/")) {
    localHref = normalizedHref.replace("https://blueprint.bryanjohnson.com", "");
  } else if (normalizedHref.startsWith("https://cdn.shopify.com/s/files/1/0772/3129/2701/files/")) {
    localHref = normalizedHref.replace("https://cdn.shopify.com/s/files/1/0772/3129/2701/files", "/cdn/shop/files");
  }

  if (!localHref.startsWith("/cdn/shop/files/")) {
    return href;
  }

  const fileName = localHref.split("/").pop() ?? "";
  if (!fileName) {
    return href;
  }

  if (filePublicAssetFiles.has(fileName)) {
    return localHref;
  }

  const extensionIndex = fileName.lastIndexOf(".");
  const rawStem = extensionIndex >= 0 ? fileName.slice(0, extensionIndex) : fileName;
  const rawExtension = extensionIndex >= 0 ? fileName.slice(extensionIndex + 1) : "";

  const diskMatch = Array.from(filePublicAssetFiles).find((candidateFileName) => {
    return (
      candidateFileName.startsWith(`${rawStem}__q_`) &&
      (!rawExtension || candidateFileName.endsWith(`.${rawExtension}`))
    );
  });

  if (diskMatch) {
    return `/cdn/shop/files/${diskMatch}`;
  }

  return href;
}

function normalizeLocalAssetMarkup(markup: string) {
  return markup
    .replace(/https:\/\/blueprint\.bryanjohnson\.com\/cdn\/shop\/files[^\s"'()<>]*/g, (match) =>
      resolveLocalFileAssetHref(match)
    )
    .replace(/https:\/\/cdn\.shopify\.com\/s\/files\/1\/0772\/3129\/2701\/files[^\s"'()<>]*/g, (match) =>
      resolveLocalFileAssetHref(match)
    );
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
