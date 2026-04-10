export type ProductImage = {
  src: string;
  alt: string;
};

export type RichTextNode =
  | { type: "text"; text: string }
  | { type: "lineBreak" }
  | { type: "emphasis"; children: RichTextNode[] }
  | { type: "strong"; children: RichTextNode[] }
  | { type: "code"; children: RichTextNode[] }
  | { type: "superscript"; children: RichTextNode[] }
  | { type: "subscript"; children: RichTextNode[] }
  | {
      type: "link";
      href: string;
      external: boolean;
      children: RichTextNode[];
    };

export type RichContentBlock =
  | {
      type: "paragraph";
      children: RichTextNode[];
    }
  | {
      type: "heading";
      level: 1 | 2 | 3 | 4 | 5 | 6;
      children: RichTextNode[];
    }
  | {
      type: "list";
      ordered: boolean;
      items: RichContentBlock[][];
    }
  | {
      type: "image";
      src: string;
      alt: string;
      caption?: RichTextNode[];
    }
  | {
      type: "quote";
      blocks: RichContentBlock[];
    }
  | {
      type: "table";
      head: RichContentBlock[][][] | null;
      rows: RichContentBlock[][][];
    }
  | {
      type: "embed";
      kind: "instagram";
      eyebrow?: string;
      title: string;
      copy?: string;
      href: string;
      ctaLabel: string;
    }
  | {
      type: "snapshot";
      body: RichContentBlock[];
      image?: ProductImage | null;
      reversed?: boolean;
      title?: string;
    }
  | {
      type: "divider";
    };

export type ProductVariant = {
  id: number;
  title: string;
  publicTitle?: string | null;
  sku?: string | null;
  price: number;
  compareAtPrice?: number | null;
  available: boolean;
  options: string[];
  featuredImage?: string | null;
};

export type SellingPlanGroup = {
  id: string;
  name: string;
  options: Array<{
    name: string;
    position: number;
    values?: string[];
    value?: string;
  }>;
};

export type Product = {
  id: number;
  handle: string;
  title: string;
  summary: string;
  descriptionHtml: string;
  descriptionBlocks?: RichContentBlock[];
  vendor: string;
  type: string;
  tags: string[];
  available: boolean;
  priceMin: number;
  priceMax: number;
  images: ProductImage[];
  variants: ProductVariant[];
  sellingPlanGroups: SellingPlanGroup[];
  legacyPath: string;
  collectionHandles: string[];
  keywords: string;
  rating?: number | null;
  reviewsCount?: number | null;
};

export type Collection = {
  handle: string;
  title: string;
  description: string;
  image?: string | null;
  productHandles: string[];
  legacyPath: string;
};

export type Blog = {
  handle: string;
  title: string;
  description: string;
  image?: string | null;
  legacyPath: string;
};

export type RelatedArticle = {
  title: string;
  href: string;
  image?: string | null;
  tag?: string | null;
};

export type Article = {
  blogHandle: string;
  slug: string;
  title: string;
  description: string;
  image?: string | null;
  author?: string | null;
  publishedAt?: string | null;
  publishedLabel?: string | null;
  tags: string[];
  bodyHtml: string;
  bodyBlocks?: RichContentBlock[];
  relatedArticles: RelatedArticle[];
  relatedProductHandles: string[];
  legacyPath: string;
};

export type StaticPage = {
  handle: string;
  title: string;
  description: string;
  image?: string | null;
  bodyHtml: string;
  bodyBlocks?: RichContentBlock[];
  legacyPath: string;
};

export type CoaCategory = "all" | "nutrition" | "supplements" | "skincare" | "haircare";

export type CoaEntry = {
  title: string;
  href: string;
  image: string;
  reportHref: string;
  priceLabel: string;
  category: Exclude<CoaCategory, "all">;
};

export type CoaFaq = {
  question: string;
  answerHtml: string;
  answerBlocks?: RichContentBlock[];
};

export type CoaPageData = {
  heroTitle: string;
  heroDescription: string;
  heroDesktopImage: string;
  heroMobileImage: string;
  entries: CoaEntry[];
  faqs: CoaFaq[];
};

export type Manifest = {
  generatedAt: string;
  siteName: string;
  siteDescription: string;
  counts: {
    products: number;
    collections: number;
    blogs: number;
    articles: number;
    pages: number;
  };
};

export type CartLine = {
  id: string;
  productHandle: string;
  productTitle: string;
  variantId: number;
  variantTitle: string;
  price: number;
  quantity: number;
  image?: string | null;
  isSubscription?: boolean;
  basePrice?: number;
  baseVariantTitle?: string;
};

export type AccountProfile = {
  signedIn: boolean;
  name: string;
  email: string;
};
