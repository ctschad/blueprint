#!/usr/bin/env python3

from __future__ import annotations

import html
import json
import re
import shutil
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Callable
from urllib.parse import urljoin, urlparse


ROOT = Path(__file__).resolve().parents[1]
MIRROR_DIR = ROOT / "mirror" / "blueprint.bryanjohnson.com"
OUTPUT_DIR = ROOT / "storefront-next" / "data" / "generated"
PUBLIC_DIR = ROOT / "storefront-next" / "public"
SITE_URL = "https://blueprint.bryanjohnson.com"
APP_ROUTE_PREFIXES = (
    "/",
    "/products/",
    "/collections/",
    "/blogs/",
    "/pages/",
    "/account",
    "/search",
    "/cart",
)


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def ensure_output_dir() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def strip_tags(value: str | None) -> str:
    if not value:
        return ""
    value = re.sub(r"<script\b[^>]*>.*?</script>", "", value, flags=re.S | re.I)
    value = re.sub(r"<style\b[^>]*>.*?</style>", "", value, flags=re.S | re.I)
    value = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def normalize_asset_url(url: str | None) -> str | None:
    if not url:
        return None
    url = html.unescape(url).strip()
    if not url:
        return None
    if url.startswith("//"):
        return f"https:{url}"
    if url.startswith("http://") or url.startswith("https://"):
        if url.startswith(f"{SITE_URL}/cdn.shopify.com/"):
            return url.replace(f"{SITE_URL}/cdn.shopify.com/", "https://cdn.shopify.com/", 1)
        return url
    if url.startswith("/cdn.shopify.com/"):
        return f"https:/{url}"
    while url.startswith("../"):
        url = url[3:]
    while url.startswith("./"):
        url = url[2:]
    if url.startswith("cdn.shopify.com/"):
        return f"https://{url}"
    if url.startswith("/"):
        return f"{SITE_URL}{url}"
    if re.match(r"^(cdn|products|collections|blogs|pages)/", url):
        return f"{SITE_URL}/{url}"
    return url


def normalize_app_path(url: str | None) -> str | None:
    if not url:
        return None
    url = html.unescape(url).strip()
    if not url:
        return None
    url = re.sub(r"^https?://blueprint\.bryanjohnson\.com", "", url)
    url = re.sub(r"^\.\./", "", url)
    url = re.sub(r"^\./", "", url)
    if not url.startswith("/"):
        url = f"/{url}"
    parsed = urlparse(url)
    path = parsed.path or "/"
    if path.endswith(".html"):
        path = path[:-5]
    if path in ("", "/index"):
        path = "/"
    return f"{path}?{parsed.query}" if parsed.query else path


def extract_meta(html_text: str, attr: str, value: str) -> str | None:
    pattern = rf'<meta[^>]+{attr}="{re.escape(value)}"[^>]+content="([^"]*)"'
    match = re.search(pattern, html_text, flags=re.I)
    return html.unescape(match.group(1)).strip() if match else None


def extract_title(html_text: str) -> str:
    meta_title = extract_meta(html_text, "property", "og:title")
    if meta_title:
        return meta_title
    match = re.search(r"<title>\s*(.*?)\s*</title>", html_text, flags=re.S | re.I)
    if not match:
        return ""
    title = html.unescape(match.group(1))
    return re.sub(r"\s*[–-]\s*Blueprint Bryan Johnson\s*$", "", title).strip()


def extract_first(pattern: str, html_text: str) -> str | None:
    match = re.search(pattern, html_text, flags=re.S | re.I)
    return match.group(1).strip() if match else None


@dataclass
class Capture:
    html: str
    attrs: dict[str, str]
    tag: str


class ElementCollector(HTMLParser):
    def __init__(self, predicate: Callable[[str, dict[str, str]], bool], limit: int | None = None):
        super().__init__(convert_charrefs=False)
        self.predicate = predicate
        self.limit = limit
        self.captures: list[Capture] = []
        self._stack: list[tuple[str, list[str], dict[str, str]]] = []

    def _attrs_dict(self, attrs: list[tuple[str, str | None]]) -> dict[str, str]:
        return {key: value or "" for key, value in attrs}

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr_dict = self._attrs_dict(attrs)
        start_html = self.get_starttag_text()
        if self._stack:
            for _, parts, _ in self._stack:
                parts.append(start_html)
        if self.limit is not None and len(self.captures) >= self.limit:
            return
        if self.predicate(tag, attr_dict):
            self._stack.append((tag, [start_html], attr_dict))

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)
        if self._stack and self._stack[-1][0] == tag:
            self.handle_endtag(tag)

    def handle_endtag(self, tag: str) -> None:
        if not self._stack:
            return
        for _, parts, _ in self._stack:
            parts.append(f"</{tag}>")
        top_tag, parts, attrs = self._stack[-1]
        if top_tag == tag:
            self._stack.pop()
            self.captures.append(Capture("".join(parts), attrs, tag))

    def handle_data(self, data: str) -> None:
        if self._stack:
            for _, parts, _ in self._stack:
                parts.append(data)

    def handle_comment(self, data: str) -> None:
        if self._stack:
            comment = f"<!--{data}-->"
            for _, parts, _ in self._stack:
                parts.append(comment)

    def handle_entityref(self, name: str) -> None:
        if self._stack:
            for _, parts, _ in self._stack:
                parts.append(f"&{name};")

    def handle_charref(self, name: str) -> None:
        if self._stack:
            for _, parts, _ in self._stack:
                parts.append(f"&#{name};")


def capture_elements(html_text: str, predicate: Callable[[str, dict[str, str]], bool], limit: int | None = None) -> list[Capture]:
    collector = ElementCollector(predicate, limit=limit)
    collector.feed(html_text)
    return collector.captures


def classes_contain(attrs: dict[str, str], *needles: str) -> bool:
    class_name = attrs.get("class", "")
    return all(needle in class_name for needle in needles)


def dedupe_order(items: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for item in items:
        if item in seen:
            continue
        seen.add(item)
        ordered.append(item)
    return ordered


def extract_product_json(html_text: str) -> dict:
    match = re.search(
        r'<script type="application/json" data-product-json>\s*(\{.*?\})\s*</script>',
        html_text,
        flags=re.S | re.I,
    )
    if not match:
        raise ValueError("Missing product JSON")
    return json.loads(match.group(1))


def product_images(product_blob: dict) -> list[dict]:
    urls: dict[str, dict] = {}
    product = product_blob.get("product", {})
    media_items = product.get("media") or []
    image_items = product.get("images") or []

    for item in media_items:
        preview = item.get("preview_image") or {}
        src = normalize_asset_url(preview.get("src") or item.get("src"))
        if not src:
            continue
        urls.setdefault(src, {"src": src, "alt": item.get("alt") or preview.get("alt") or product.get("title", "")})

    for item in image_items:
        if isinstance(item, str):
            src = normalize_asset_url(item)
            alt = product.get("title", "")
        else:
            src = normalize_asset_url(item.get("src"))
            alt = item.get("alt") or product.get("title", "")
        if not src:
            continue
        urls.setdefault(src, {"src": src, "alt": alt})

    if not urls:
        featured = product.get("featured_image") or {}
        src = normalize_asset_url(featured.get("src"))
        if src:
            urls[src] = {"src": src, "alt": featured.get("alt") or product.get("title", "")}

    return list(urls.values())


def parse_collection_cards(collection_html: str) -> list[dict]:
    cards = capture_elements(
        collection_html,
        lambda tag, attrs: tag == "div" and classes_contain(attrs, "product-card"),
    )
    parsed: list[dict] = []
    seen_handles: set[str] = set()
    for card in cards:
        handle = extract_first(r'data-product-url="/products/([^"]+)"', card.html)
        if not handle or handle in seen_handles:
            continue
        seen_handles.add(handle)
        title = strip_tags(extract_first(r'class="product-card-title"[^>]*>\s*(.*?)\s*</a>', card.html) or "")
        keywords = html.unescape(card.attrs.get("data-pdp-keywords", "")).strip()
        rating = extract_first(r'aria-label="([0-9.]+) out of 5 stars"', card.html)
        reviews = extract_first(r'class="rating-count[^"]*">\((\d+)\)', card.html)
        parsed.append(
            {
                "handle": handle,
                "title": title,
                "keywords": keywords,
                "rating": float(rating) if rating else None,
                "reviewsCount": int(reviews) if reviews else None,
            }
        )
    return parsed


def extract_catalog_meta(collection_html: str) -> dict[str, dict]:
    meta: dict[str, dict] = {}
    for segment in collection_html.split('<div class="product-card"')[1:]:
        card_html = f'<div class="product-card"{segment}'
        handle = extract_first(r'data-product-url="/products/([^"]+)"', card_html)
        if not handle or handle in meta:
            continue
        rating = extract_first(r'aria-label="([0-9.]+) out of 5 stars"', card_html)
        reviews = extract_first(r'class="rating-count[^"]*">\((\d+)\)', card_html)
        meta[handle] = {
            "keywords": html.unescape(extract_first(r'data-pdp-keywords="([^"]+)"', card_html) or "").strip(),
            "rating": float(rating) if rating else None,
            "reviewsCount": int(reviews) if reviews else None,
        }
    return meta


def extract_inner_html(fragment: str) -> str:
    match = re.match(r"^\s*<([a-z0-9:-]+)\b[^>]*>(.*)</\1>\s*$", fragment, flags=re.S | re.I)
    return match.group(2).strip() if match else fragment.strip()


def resolve_url(url: str | None, source_relative: str) -> str | None:
    if not url:
        return None
    raw = html.unescape(url).strip()
    if not raw:
        return None
    if raw.startswith(("#", "mailto:", "tel:", "javascript:", "data:")):
        return raw
    if raw.startswith("//"):
        return f"https:{raw}"
    if raw.startswith("http://") or raw.startswith("https://"):
        return raw

    base_url = f"{SITE_URL}/{source_relative}"
    resolved = urljoin(base_url, raw)
    if resolved.startswith(f"{SITE_URL}/cdn.shopify.com/"):
        return resolved.replace(f"{SITE_URL}/cdn.shopify.com/", "https://cdn.shopify.com/", 1)
    return resolved


def mirror_asset_to_public_url(resolved_url: str) -> str | None:
    parsed = urlparse(resolved_url)
    if parsed.scheme not in {"", "http", "https"}:
        return None
    if parsed.netloc and parsed.netloc != urlparse(SITE_URL).netloc:
        return None

    relative_path = parsed.path.lstrip("/")
    if not relative_path or relative_path.startswith(("_next/", "api/")):
        return None

    source_path = MIRROR_DIR / relative_path
    if not source_path.is_file():
        return None

    target_path = PUBLIC_DIR / relative_path
    target_path.parent.mkdir(parents=True, exist_ok=True)
    if not target_path.exists() or source_path.stat().st_size != target_path.stat().st_size:
        shutil.copy2(source_path, target_path)

    return parsed.path


def normalize_fragment_asset(url: str | None, source_relative: str) -> str | None:
    resolved = resolve_url(url, source_relative)
    if not resolved:
        return None
    local_asset = mirror_asset_to_public_url(resolved)
    if local_asset:
        return local_asset
    return normalize_asset_url(resolved) or resolved


def normalize_fragment_link(url: str | None, source_relative: str) -> str | None:
    resolved = resolve_url(url, source_relative)
    if not resolved:
        return None
    if resolved.startswith(("#", "mailto:", "tel:", "javascript:", "data:")):
        return resolved
    if resolved.startswith(SITE_URL):
        parsed = urlparse(resolved)
        if parsed.path == "/" or parsed.path.startswith(APP_ROUTE_PREFIXES[1:]):
            return normalize_app_path(resolved)
    return resolved


def normalize_srcset(value: str, source_relative: str) -> str:
    candidates: list[str] = []
    for candidate in value.split(","):
        item = candidate.strip()
        if not item:
            continue
        parts = item.split()
        url = normalize_fragment_asset(parts[0], source_relative)
        if not url:
            continue
        candidates.append(" ".join([url, *parts[1:]]).strip())
    return ", ".join(candidates)


def rewrite_html_fragment(fragment: str, source_relative: str) -> str:
    cleaned = fragment.strip()
    cleaned = re.sub(r"<script\b[^>]*>.*?</script>", "", cleaned, flags=re.S | re.I)
    cleaned = re.sub(r"<style\b[^>]*>.*?</style>", "", cleaned, flags=re.S | re.I)
    cleaned = re.sub(r"<link\b[^>]*>", "", cleaned, flags=re.I)
    cleaned = re.sub(r"<meta\b[^>]*>", "", cleaned, flags=re.I)
    cleaned = re.sub(r"\s(?:x-[\w:.-]+|:[\w.-]+|@[\w:.-]+|on\w+)=(\".*?\"|\'.*?\'|[^\s>]+)", "", cleaned, flags=re.S | re.I)

    def replace_attribute(match: re.Match[str]) -> str:
        attr = match.group("attr")
        quote = match.group("quote")
        value = match.group("value")
        if attr.lower() == "srcset":
            updated = normalize_srcset(value, source_relative)
        elif attr.lower() in {"href", "action"}:
            updated = normalize_fragment_link(value, source_relative) or value
        else:
            updated = normalize_fragment_asset(value, source_relative) or value
        return f'{attr}={quote}{html.escape(updated, quote=True)}{quote}'

    cleaned = re.sub(
        r'(?P<attr>\b(?:href|src|srcset|poster|action)\b)\s*=\s*(?P<quote>["\'])(?P<value>.*?)(?P=quote)',
        replace_attribute,
        cleaned,
        flags=re.S | re.I,
    )

    def replace_css_url(match: re.Match[str]) -> str:
        quote = match.group("quote") or ""
        value = match.group("value")
        updated = normalize_fragment_asset(value, source_relative) or value
        return f"url({quote}{html.escape(updated, quote=True)}{quote})"

    cleaned = re.sub(
        r'url\((?P<quote>["\']?)(?P<value>.*?)(?P=quote)\)',
        replace_css_url,
        cleaned,
        flags=re.S | re.I,
    )
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def parse_published_iso(date_label: str | None) -> str | None:
    if not date_label:
        return None
    for format_string in ("%m.%d.%Y", "%m/%d/%Y", "%B %d, %Y", "%b %d, %Y"):
        try:
            return datetime.strptime(date_label.strip(), format_string).date().isoformat()
        except ValueError:
            continue
    return None


def extract_article_date_parts(html_text: str) -> tuple[str | None, str | None]:
    line = strip_tags(extract_first(r'<p class="article-date">\s*(.*?)\s*</p>', html_text) or "")
    if not line:
        return None, None
    line = re.sub(r"\s+", " ", line).strip()
    author_match = re.search(r"Written by\s+(.*?)\s*[•·]\s*(.+)$", line)
    if author_match:
        return author_match.group(1).strip(), author_match.group(2).strip()
    author_only = re.search(r"Written by\s+(.*)$", line)
    if author_only:
        return author_only.group(1).strip(), None
    return None, line


def extract_article_body_html(html_text: str, source_relative: str) -> str:
    captures = capture_elements(
        html_text,
        lambda tag, attrs: tag == "div" and classes_contain(attrs, "page__body", "content-blog", "anm-fade-element"),
        limit=1,
    )
    if not captures:
        return ""
    return rewrite_html_fragment(extract_inner_html(captures[0].html), source_relative)


def extract_article_related_articles(html_text: str, source_relative: str) -> list[dict]:
    sidebar_match = re.search(
        r'<div class="related-articles-sidebar hidden md:block">(.*?)<button id="scroll-to-top-btn"',
        html_text,
        flags=re.S | re.I,
    )
    if not sidebar_match:
        return []

    cards = re.findall(
        r'<a href="([^"]+)" class="related-article-card group">(.*?)</a>',
        sidebar_match.group(1),
        flags=re.S | re.I,
    )

    related: list[dict] = []
    seen_paths: set[str] = set()
    for raw_href, card_html in cards:
        href = normalize_fragment_link(raw_href, source_relative)
        title = strip_tags(extract_first(r'class="related-article-title[^"]*"[^>]*>\s*(.*?)\s*</h4>', card_html) or "")
        image = normalize_fragment_asset(extract_first(r'<img[^>]+src="([^"]+)"', card_html), source_relative)
        tag = strip_tags(extract_first(r'class="article-tag-glassmorphic"[^>]*>\s*(.*?)\s*</span>', card_html) or "")
        if not href or not title or href in seen_paths:
            continue
        seen_paths.add(href)
        related.append(
            {
                "title": title,
                "href": href,
                "image": image,
                "tag": tag or None,
            }
        )
    return related


def extract_article_related_products(html_text: str) -> list[str]:
    if "upsell-carousel-container" not in html_text:
        return []
    tail = html_text.split("upsell-carousel-container", 1)[1]
    return dedupe_order(re.findall(r'data-product-url="/products/([^"]+)"', tail))


def extract_page_body_html(html_text: str, source_relative: str) -> str:
    captures = capture_elements(
        html_text,
        lambda tag, attrs: tag == "main" and attrs.get("id") == "MainContent",
        limit=1,
    )
    if not captures:
        return ""
    body = rewrite_html_fragment(extract_inner_html(captures[0].html), source_relative)
    body = re.sub(r"<section[^>]*>\s*</section>", "", body, flags=re.S | re.I)
    body = re.sub(r"<div[^>]*>\s*</div>", "", body, flags=re.S | re.I)
    return body.strip()


def collect_products() -> dict[str, dict]:
    products: dict[str, dict] = {}
    for path in sorted((MIRROR_DIR / "products").glob("*.html")):
        if "__q_" in path.stem:
            continue
        try:
            blob = extract_product_json(read_text(path))
        except ValueError:
            continue
        product = blob.get("product", {})
        handle = product.get("handle")
        if not handle:
            continue
        products[handle] = {
            "id": product.get("id"),
            "handle": handle,
            "title": product.get("title", ""),
            "summary": strip_tags(product.get("description"))[:220],
            "descriptionHtml": product.get("description", ""),
            "vendor": product.get("vendor", ""),
            "type": product.get("type", ""),
            "tags": product.get("tags", []),
            "available": product.get("available", False),
            "priceMin": product.get("price_min"),
            "priceMax": product.get("price_max"),
            "images": product_images(blob),
            "variants": [
                {
                    "id": variant.get("id"),
                    "title": variant.get("title") or "",
                    "publicTitle": variant.get("public_title"),
                    "sku": variant.get("sku"),
                    "price": variant.get("price"),
                    "compareAtPrice": variant.get("compare_at_price"),
                    "available": variant.get("available", False),
                    "options": variant.get("options", []),
                    "featuredImage": normalize_asset_url(
                        (variant.get("featured_image") or {}).get("src")
                    ),
                }
                for variant in product.get("variants", [])
            ],
            "sellingPlanGroups": blob.get("sellingPlanGroups", []),
            "legacyPath": f"/legacy/products/{path.name}",
        }
    return products


def collect_collections() -> tuple[list[dict], dict[str, set[str]], dict[str, dict]]:
    collection_products: dict[str, set[str]] = defaultdict(set)
    product_meta: dict[str, dict] = {}
    collections: list[dict] = []

    for path in sorted((MIRROR_DIR / "collections").glob("*.html")):
        if "__q_" in path.stem:
            continue
        html_text = read_text(path)
        handle = path.stem
        product_handles = dedupe_order(re.findall(r'data-product-url="/products/([^"]+)"', html_text))
        for product_handle in product_handles:
            collection_products[product_handle].add(handle)
        if handle == "all-products":
            product_meta.update(extract_catalog_meta(html_text))
        collections.append(
            {
                "handle": handle,
                "title": strip_tags(extract_first(r"<h1[^>]*>(.*?)</h1>", html_text) or extract_title(html_text)),
                "description": strip_tags(extract_first(r'class="collection-description"[^>]*>(.*?)</p>', html_text) or ""),
                "image": normalize_asset_url(extract_meta(html_text, "property", "og:image")),
                "productHandles": product_handles,
                "legacyPath": f"/legacy/collections/{path.name}",
            }
        )

    return collections, collection_products, product_meta


def collect_blogs_and_articles() -> tuple[list[dict], list[dict]]:
    blogs: dict[str, dict] = {}
    articles: list[dict] = []

    for path in sorted((MIRROR_DIR / "blogs").glob("**/*.html")):
        relative = path.relative_to(MIRROR_DIR).as_posix()
        parts = relative.split("/")
        if "__q_" in path.stem or "tagged" in parts:
            continue
        html_text = read_text(path)

        if len(parts) == 2:
            blog_handle = path.stem
            blogs[blog_handle] = {
                "handle": blog_handle,
                "title": extract_title(html_text),
                "description": extract_meta(html_text, "property", "og:description") or "",
                "image": normalize_asset_url(extract_meta(html_text, "property", "og:image")),
                "legacyPath": f"/legacy/blogs/{path.name}",
            }
            continue

        blog_handle = parts[1]
        slug = path.stem
        source_relative = relative
        author, published_label = extract_article_date_parts(html_text)
        published_at = extract_first(r'<time[^>]+datetime="([^"]+)"', html_text) or parse_published_iso(published_label)
        tags = re.findall(r'class="article-tag-glassmorphic[^"]*"[^>]*>\s*([^<]+?)\s*</a>', html_text)
        articles.append(
            {
                "blogHandle": blog_handle,
                "slug": slug,
                "title": extract_title(html_text),
                "description": extract_meta(html_text, "property", "og:description") or "",
                "image": normalize_asset_url(extract_meta(html_text, "property", "og:image")),
                "author": author,
                "publishedAt": published_at,
                "publishedLabel": published_label,
                "tags": [strip_tags(tag) for tag in tags],
                "bodyHtml": extract_article_body_html(html_text, source_relative),
                "relatedArticles": extract_article_related_articles(html_text, source_relative),
                "relatedProductHandles": extract_article_related_products(html_text),
                "legacyPath": f"/legacy/{relative}",
            }
        )

    return sorted(blogs.values(), key=lambda item: item["title"].lower()), sorted(
        articles,
        key=lambda item: (item["publishedAt"] or "", item["title"]),
        reverse=True,
    )


def collect_pages() -> list[dict]:
    pages: list[dict] = []
    for path in sorted((MIRROR_DIR / "pages").glob("*.html")):
        if "__q_" in path.stem:
            continue
        html_text = read_text(path)
        relative = path.relative_to(MIRROR_DIR).as_posix()
        pages.append(
            {
                "handle": path.stem,
                "title": extract_title(html_text),
                "description": extract_meta(html_text, "property", "og:description") or "",
                "image": normalize_asset_url(extract_meta(html_text, "property", "og:image")),
                "bodyHtml": extract_page_body_html(html_text, relative),
                "legacyPath": f"/legacy/pages/{path.name}",
            }
        )
    return pages


def enrich_products(
    products: dict[str, dict],
    collection_products: dict[str, set[str]],
    product_meta: dict[str, dict],
) -> list[dict]:
    enriched: list[dict] = []
    for handle, product in products.items():
        meta = product_meta.get(handle, {})
        enriched.append(
            {
                **product,
                "collectionHandles": sorted(collection_products.get(handle, set())),
                "keywords": meta.get("keywords", ""),
                "rating": meta.get("rating"),
                "reviewsCount": meta.get("reviewsCount"),
            }
        )
    return sorted(enriched, key=lambda item: item["title"].lower())


def write_json(filename: str, payload: object) -> None:
    (OUTPUT_DIR / filename).write_text(
        json.dumps(payload, indent=2, ensure_ascii=True) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    ensure_output_dir()

    products = collect_products()
    collections, collection_products, product_meta = collect_collections()
    blogs, articles = collect_blogs_and_articles()
    pages = collect_pages()
    enriched_products = enrich_products(products, collection_products, product_meta)

    manifest = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "siteName": "Blueprint Bryan Johnson",
        "siteDescription": "A Next.js rewrite powered by mirrored storefront data.",
        "counts": {
            "products": len(enriched_products),
            "collections": len(collections),
            "blogs": len(blogs),
            "articles": len(articles),
            "pages": len(pages),
        },
    }

    write_json("manifest.json", manifest)
    write_json("products.json", enriched_products)
    write_json("collections.json", collections)
    write_json("blogs.json", blogs)
    write_json("articles.json", articles)
    write_json("pages.json", pages)

    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
