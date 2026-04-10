import fs from "fs";
import path from "path";
import { htmlToRichContent, richContentToPlainText } from "@/lib/rich-content";
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

type SearchableProduct = {
  handle: string;
  image: string | null;
  keywords: string;
  priceMin: number;
  rating: number | null;
  reviewsCount: number | null;
  summary: string;
  title: string;
  vendor: string;
};

type SearchableArticle = {
  href: string;
  image: string | null;
  title: string;
};

type SearchPayload = {
  articles: SearchableArticle[];
  products: SearchableProduct[];
};

type StorefrontState = {
  articles: Article[];
  articleMap: Map<string, Article>;
  blogs: Blog[];
  blogMap: Map<string, Blog>;
  collections: Collection[];
  collectionMap: Map<string, Collection>;
  manifest: Manifest;
  pageMap: Map<string, StaticPage>;
  pages: StaticPage[];
  productMap: Map<string, Product>;
  products: Product[];
};

const GENERATED_DATA_DIR = path.join(process.cwd(), "data", "generated");
const articlePlaceholderImage = "/cdn/shop/files/placeholder-2_385x215_crop_center__q_526e273fc83f.png";
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

let cachedState: StorefrontState | null = null;
let cachedArticleAssetFiles: Set<string> | null = null;
let cachedFileAssetFiles: Set<string> | null = null;

function readGeneratedJson<T>(fileName: string): T {
  const filePath = path.join(GENERATED_DATA_DIR, fileName);
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function getAssetFileNames(kind: "articles" | "files") {
  if (kind === "articles" && cachedArticleAssetFiles) {
    return cachedArticleAssetFiles;
  }

  if (kind === "files" && cachedFileAssetFiles) {
    return cachedFileAssetFiles;
  }

  const directory = path.join(process.cwd(), "public", "cdn", "shop", kind);
  const fileNames = new Set(fs.existsSync(directory) ? fs.readdirSync(directory) : []);

  if (kind === "articles") {
    cachedArticleAssetFiles = fileNames;
  } else {
    cachedFileAssetFiles = fileNames;
  }

  return fileNames;
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(markup: string) {
  return markup.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
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

function normalizeLegacyProductHref(href: string) {
  const rawHandle = href.split("/products/").pop() ?? href;
  const handle = rawHandle.replace(/__q_[^/?#]+/, "");
  return {
    handle,
    href: `/products/${handle}`
  };
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

  const fileAssetFiles = getAssetFileNames("files");
  if (fileAssetFiles.has(fileName)) {
    return localHref;
  }

  const extensionIndex = fileName.lastIndexOf(".");
  const rawStem = extensionIndex >= 0 ? fileName.slice(0, extensionIndex) : fileName;
  const rawExtension = extensionIndex >= 0 ? fileName.slice(extensionIndex + 1) : "";

  for (const candidateFileName of fileAssetFiles) {
    if (
      candidateFileName.startsWith(`${rawStem}__q_`) &&
      (!rawExtension || candidateFileName.endsWith(`.${rawExtension}`))
    ) {
      return `/cdn/shop/files/${candidateFileName}`;
    }
  }

  return href;
}

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

  const articleAssetFiles = getAssetFileNames("articles");
  if (articleAssetFiles.has(fileName)) {
    return normalizedHref;
  }

  const extensionIndex = fileName.lastIndexOf(".");
  const rawStem = extensionIndex >= 0 ? fileName.slice(0, extensionIndex) : fileName;
  const rawExtension = extensionIndex >= 0 ? fileName.slice(extensionIndex + 1) : "";

  for (const candidateFileName of articleAssetFiles) {
    if (
      candidateFileName.startsWith(`${rawStem}__q_`) &&
      (!rawExtension || candidateFileName.endsWith(`.${rawExtension}`))
    ) {
      return `/cdn/shop/articles/${candidateFileName}`;
    }
  }

  return normalizedHref;
}

function normalizeArticleAssetHref(href: string) {
  if (href.startsWith("https://blueprint.bryanjohnson.com/cdn/shop/articles/") || href.startsWith("/cdn/shop/articles/")) {
    return resolveLocalArticleAssetHref(href);
  }

  if (
    href.startsWith("https://blueprint.bryanjohnson.com/cdn/shop/files") ||
    href.startsWith("https://cdn.shopify.com/s/files/1/0772/3129/2701/files")
  ) {
    return resolveLocalFileAssetHref(href);
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
    )
    .replace(/https:\/\/blueprint\.bryanjohnson\.com\/cdn\/shop\/articles[^\s"'()<>]*/g, (match) =>
      resolveLocalArticleAssetHref(match)
    );
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

function sanitizeProduct(product: Product): Product {
  return {
    ...product,
    collectionHandles: product.collectionHandles.filter((handle) => !hiddenMarketCollectionHandles.has(handle)),
    descriptionHtml: normalizeLocalAssetMarkup(product.descriptionHtml),
    descriptionBlocks: htmlToRichContent(normalizeLocalAssetMarkup(product.descriptionHtml)),
    images: product.images.map((image) => ({
      ...image,
      src: resolveLocalFileAssetHref(image.src)
    })),
    variants: product.variants.map((variant) => ({
      ...variant,
      featuredImage: variant.featuredImage ? resolveLocalFileAssetHref(variant.featuredImage) : variant.featuredImage
    }))
  };
}

function sanitizeCollection(collection: Collection): Collection {
  return {
    ...collection,
    image: collection.image ? resolveLocalFileAssetHref(collection.image) : collection.image
  };
}

function sanitizeBlog(blog: Blog): Blog {
  return {
    ...blog,
    image: blog.image ? normalizeArticleAssetHref(blog.image) : blog.image
  };
}

function sanitizePage(page: StaticPage): StaticPage {
  const bodyHtml = normalizeLocalAssetMarkup(page.bodyHtml);

  return {
    ...page,
    image: page.image ? resolveLocalFileAssetHref(page.image) : page.image,
    bodyHtml,
    bodyBlocks: htmlToRichContent(bodyHtml)
  };
}

function sanitizeArticle(article: Article): Article {
  const bodyHtml = normalizeLocalAssetMarkup(normalizeInstagramEmbeds(article.bodyHtml));
  const bodyBlocks = htmlToRichContent(bodyHtml);
  const fallbackDescription = summarizeText(richContentToPlainText(bodyBlocks), 180);
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
    bodyBlocks,
    relatedArticles: article.relatedArticles.map((item) => ({
      ...item,
      image: item.image ? normalizeArticleAssetHref(item.image) : item.image
    }))
  };
}

function getState(): StorefrontState {
  if (cachedState) {
    return cachedState;
  }

  const manifest = readGeneratedJson<Manifest>("manifest.json");
  const products = readGeneratedJson<Product[]>("products.json").map(sanitizeProduct);
  const collections = readGeneratedJson<Collection[]>("collections.json").map(sanitizeCollection);
  const blogs = readGeneratedJson<Blog[]>("blogs.json").map(sanitizeBlog);
  const pages = readGeneratedJson<StaticPage[]>("pages.json").map(sanitizePage);
  const articles = readGeneratedJson<Article[]>("articles.json").map(sanitizeArticle);

  cachedState = {
    articles,
    articleMap: new Map(articles.map((article) => [`${article.blogHandle}:${article.slug}`, article])),
    blogs,
    blogMap: new Map(blogs.map((blog) => [blog.handle, blog])),
    collections,
    collectionMap: new Map(collections.map((collection) => [collection.handle, collection])),
    manifest,
    pageMap: new Map(pages.map((page) => [page.handle, page])),
    pages,
    productMap: new Map(products.map((product) => [product.handle, product])),
    products
  };

  return cachedState;
}

export function getManifest() {
  return getState().manifest;
}

export function getAllProducts() {
  return getState().products;
}

export function getAllArticles() {
  return getState().articles;
}

export function getAllCollections() {
  return getState().collections;
}

export function getPrimaryCollections() {
  const { collectionMap } = getState();

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
  return getState().productMap.get(handle);
}

export function getProductsByHandles(handles: string[]) {
  const { productMap } = getState();
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
  return getState().collectionMap.get(handle);
}

export function getProductsForCollection(handle: string) {
  const { collectionMap, productMap, products } = getState();
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
    return getState().products;
  }

  return getState().products.filter((product) => {
    const haystack = [
      product.title,
      product.summary,
      product.keywords,
      product.type,
      product.vendor,
      product.tags.join(" "),
      product.collectionHandles.join(" "),
      richContentToPlainText(product.descriptionBlocks ?? [])
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  });
}

export function getProductRecommendations(product: Product, limit = 4) {
  const { products } = getState();
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
  return getState().blogMap.get(handle);
}

export function getArticlesForBlog(blogHandle: string) {
  return getState().articles.filter((article) => article.blogHandle === blogHandle);
}

export function getArticle(blogHandle: string, slug: string) {
  return getState().articleMap.get(`${blogHandle}:${slug}`);
}

export function getPageByHandle(handle: string) {
  return getState().pageMap.get(handle);
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

function parseCoaEntries(markup: string, productMap: Map<string, Product>): CoaEntry[] {
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
      image: resolveLocalFileAssetHref(image),
      reportHref: resolveLocalFileAssetHref(reportHref),
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
      const answerHtml = normalizeLocalAssetMarkup(match[2]?.trim() ?? "");
      return {
        question,
        answerHtml,
        answerBlocks: htmlToRichContent(answerHtml)
      };
    })
    .filter((item) => item.question && item.answerBlocks?.length);
}

export function getCoaPageData(): CoaPageData | null {
  const { pageMap, productMap } = getState();
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

  const entries = parseCoaEntries(page.bodyHtml, productMap);
  const faqs = parseCoaFaqs(page.bodyHtml);

  if (!heroTitleMatch || !heroDescriptionMatch || !desktopImageMatch || entries.length === 0) {
    return null;
  }

  return {
    heroTitle: decodeHtmlEntities(stripTags(heroTitleMatch[1])),
    heroDescription: decodeHtmlEntities(stripTags(heroDescriptionMatch[1])),
    heroDesktopImage: resolveLocalFileAssetHref(desktopImageMatch[1]),
    heroMobileImage: mobileImageMatch?.[1] ? resolveLocalFileAssetHref(mobileImageMatch[1]) : resolveLocalFileAssetHref(desktopImageMatch[1]),
    entries,
    faqs
  };
}

function scoreProduct(product: Product, query: string) {
  let score = 0;
  const title = product.title.toLowerCase();
  const keywords = product.keywords.toLowerCase();
  const summary = product.summary.toLowerCase();
  const vendor = product.vendor.toLowerCase();
  const haystack = [
    title,
    keywords,
    summary,
    product.type.toLowerCase(),
    vendor,
    product.tags.join(" ").toLowerCase(),
    product.collectionHandles.join(" ").toLowerCase(),
    richContentToPlainText(product.descriptionBlocks ?? []).toLowerCase()
  ].join(" ");

  if (title === query) score += 120;
  if (title.startsWith(query)) score += 90;
  if (title.includes(query)) score += 72;
  if (keywords.includes(query)) score += 54;
  if (summary.includes(query)) score += 30;
  if (vendor.includes(query)) score += 18;
  if (haystack.includes(query)) score += 12;

  return score;
}

function scoreArticle(article: Article, query: string) {
  const title = article.title.toLowerCase();
  const description = article.description.toLowerCase();
  const tagHaystack = article.tags.join(" ").toLowerCase();
  const body = richContentToPlainText(article.bodyBlocks ?? []).toLowerCase();
  let score = 0;

  if (title === query) score += 120;
  if (title.startsWith(query)) score += 90;
  if (title.includes(query)) score += 60;
  if (description.includes(query)) score += 24;
  if (tagHaystack.includes(query)) score += 18;
  if (body.includes(query)) score += 12;

  return score;
}

export function searchCatalog(query: string, limits = { products: 24, articles: 8 }): SearchPayload {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return { articles: [], products: [] };
  }

  const products = getState()
    .products
    .map((product) => ({
      product,
      score: scoreProduct(product, normalizedQuery)
    }))
    .filter((item) => item.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        (right.product.rating ?? 0) - (left.product.rating ?? 0) ||
        left.product.title.localeCompare(right.product.title)
    )
    .slice(0, limits.products)
    .map(({ product }) => ({
      handle: product.handle,
      image: product.images[0]?.src ?? null,
      keywords: product.keywords,
      priceMin: product.priceMin,
      rating: product.rating ?? null,
      reviewsCount: product.reviewsCount ?? null,
      summary: product.summary,
      title: product.title,
      vendor: product.vendor
    }));

  const articles = getState()
    .articles
    .map((article) => ({
      article,
      score: scoreArticle(article, normalizedQuery)
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.article.title.localeCompare(right.article.title))
    .slice(0, limits.articles)
    .map(({ article }) => ({
      href: `/blogs/${article.blogHandle}/${article.slug}`,
      image: article.image ?? null,
      title: article.title
    }));

  return { articles, products };
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
