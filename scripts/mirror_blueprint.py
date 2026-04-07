#!/opt/homebrew/bin/python3

from __future__ import annotations

import argparse
import hashlib
import mimetypes
import os
import posixpath
import re
import sys
import time
from collections import deque
from pathlib import Path
from typing import Iterable
from urllib.parse import parse_qsl, urlencode, urljoin, urlparse, urlunparse
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET


USER_AGENT = "Mozilla/5.0 (compatible; BlueprintMirror/1.0; +local)"
DEFAULT_START = "https://blueprint.bryanjohnson.com/"
DEFAULT_ALLOWED_HOSTS = {
    "blueprint.bryanjohnson.com",
    "cdn.shopify.com",
    "shopifycdn.com",
    "fonts.shopifycdn.com",
    "transcend-cdn.com",
}
HTML_EXTENSIONS = {"", ".html", ".htm", ".php"}
TEXT_TYPES = ("text/html", "text/css", "application/javascript", "text/javascript")
SKIP_PATH_PREFIXES = (
    "/account",
    "/cart",
    "/checkout",
    "/policies/",
    "/challenge",
    "/orders",
)
URL_ATTRS = {
    "a": ("href",),
    "link": ("href",),
    "script": ("src",),
    "img": ("src", "srcset"),
    "source": ("src", "srcset"),
    "iframe": ("src",),
    "video": ("src", "poster"),
    "audio": ("src",),
    "use": ("href", "xlink:href"),
}
CSS_URL_RE = re.compile(r"url\((['\"]?)(.*?)\1\)")
SRCSET_SPLIT_RE = re.compile(r"\s*,\s*")
HTML_URL_ATTR_RE = re.compile(
    r"""(?P<prefix>\b(?:href|src|poster)=)(?P<quote>["'])(?P<value>.*?)(?P=quote)""",
    re.IGNORECASE | re.DOTALL,
)
HTML_SRCSET_ATTR_RE = re.compile(
    r"""(?P<prefix>\bsrcset=)(?P<quote>["'])(?P<value>.*?)(?P=quote)""",
    re.IGNORECASE | re.DOTALL,
)
HTML_STYLE_ATTR_RE = re.compile(
    r"""(?P<prefix>\bstyle=)(?P<quote>["'])(?P<value>.*?)(?P=quote)""",
    re.IGNORECASE | re.DOTALL,
)
HTML_IMG_SIZE_ATTR_RE = re.compile(r"(<img\b[^>]*?)\bsize=", re.IGNORECASE | re.DOTALL)
SLIDER_SCRIPT_RE = re.compile(
    r"""sliderScript:\s*(?P<quote>["'])(?P<value>//blueprint\.bryanjohnson\.com/cdn/shop/t/445/assets/splide4\.1\.3\.js\?[^"']+)(?P=quote)""",
    re.IGNORECASE,
)
COLLECTION_SORT_SCRIPT_RE = re.compile(
    r"""<script[^>]+collection-benefit-filters[^>]*></script>""",
    re.IGNORECASE,
)
COLLECTION_SORT_PAGE_PATHS = {"/collections/all-products", "/collections/all-products.html"}
COLLECTION_SORT_RELATIVE_PATH = Path(
    "blueprint.bryanjohnson.com/cdn/shop/t/445/assets/collection-local-sort.js"
)
COLLECTION_SORT_SOURCE_PATH = Path(__file__).resolve().parent / "assets" / "collection-local-sort.js"
ACCOUNT_MOCK_HTML_SOURCE_PATH = Path(__file__).resolve().parent / "assets" / "account-mock.html"
ACCOUNT_MOCK_CSS_SOURCE_PATH = Path(__file__).resolve().parent / "assets" / "account-local-mock.css"
ACCOUNT_MOCK_JS_SOURCE_PATH = Path(__file__).resolve().parent / "assets" / "account-local-mock.js"
CART_MOCK_HTML_SOURCE_PATH = Path(__file__).resolve().parent / "assets" / "cart-mock.html"
CART_MOCK_CSS_SOURCE_PATH = Path(__file__).resolve().parent / "assets" / "cart-local-mock.css"
CART_MOCK_JS_SOURCE_PATH = Path(__file__).resolve().parent / "assets" / "cart-local-mock.js"
ACCOUNT_MOCK_PAGE_RELATIVE_PATHS = (
    Path("blueprint.bryanjohnson.com/account.html"),
    Path("blueprint.bryanjohnson.com/account/login.html"),
    Path("blueprint.bryanjohnson.com/account/register.html"),
    Path("blueprint.bryanjohnson.com/account/recover.html"),
    Path("blueprint.bryanjohnson.com/account/addresses.html"),
    Path("account/index.html"),
    Path("account/login/index.html"),
    Path("account/register/index.html"),
    Path("account/recover/index.html"),
    Path("account/addresses/index.html"),
)
ACCOUNT_MOCK_ASSET_TARGETS = (
    (
        ACCOUNT_MOCK_CSS_SOURCE_PATH,
        Path("blueprint.bryanjohnson.com/cdn/shop/t/445/assets/account-local-mock.css"),
    ),
    (
        ACCOUNT_MOCK_JS_SOURCE_PATH,
        Path("blueprint.bryanjohnson.com/cdn/shop/t/445/assets/account-local-mock.js"),
    ),
)
CART_MOCK_PAGE_RELATIVE_PATHS = (
    Path("blueprint.bryanjohnson.com/cart.html"),
    Path("blueprint.bryanjohnson.com/cart/index.html"),
    Path("cart/index.html"),
    Path("cart.html"),
)
CART_MOCK_ASSET_TARGETS = (
    (
        CART_MOCK_CSS_SOURCE_PATH,
        Path("blueprint.bryanjohnson.com/cdn/shop/t/445/assets/cart-local-mock.css"),
    ),
    (
        CART_MOCK_JS_SOURCE_PATH,
        Path("blueprint.bryanjohnson.com/cdn/shop/t/445/assets/cart-local-mock.js"),
    ),
)
LOCAL_SEARCH_ROOT_RELATIVE_PATH = Path("search/index.html")
LOCAL_SEARCH_PAGE_RELATIVE_PATH = Path("blueprint.bryanjohnson.com/search.html")
LOCAL_SEARCH_REDIRECT_HTML = """<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Search | Blueprint Bryan Johnson</title>
    <meta name="robots" content="noindex">
    <script>
      (function () {
        var currentUrl = new URL(window.location.href);
        var targetUrl = new URL("/blueprint.bryanjohnson.com/collections/all-products.html", window.location.origin);

        currentUrl.searchParams.forEach(function (value, key) {
          targetUrl.searchParams.set(key, value);
        });

        window.location.replace(targetUrl.toString());
      })();
    </script>
  </head>
  <body>
    <p>Redirecting to local search results...</p>
  </body>
</html>
"""
LOCAL_SPLIDE_ALIAS_RELATIVE_PATH = Path(
    "blueprint.bryanjohnson.com/cdn/shop/t/445/assets/splide-local.js"
)
LOCAL_SPLIDE_THEME_SNIPPET = """
;(() => {
  const localHosts = new Set(["127.0.0.1", "localhost"]);
  const basePath = "/blueprint.bryanjohnson.com";
  const sliderScriptPath = `${basePath}/cdn/shop/t/445/assets/splide-local.js`;
  const cartScriptPath = `${basePath}/cdn/shop/t/445/assets/cart-local-mock.js`;
  const cartStylesPath = `${basePath}/cdn/shop/t/445/assets/cart-local-mock.css`;
  const isLocalMirror =
    localHosts.has(window.location.hostname) ||
    window.location.pathname.startsWith(`${basePath}/`);

  if (!isLocalMirror || !window.Eurus) {
    return;
  }

  window.Eurus.sliderScript = sliderScriptPath;
  if (!(window.Eurus.loadedScript instanceof Set)) {
    window.Eurus.loadedScript = new Set(
      Array.isArray(window.Eurus.loadedScript) ? window.Eurus.loadedScript : []
    );
  }

  const getProductHandle = (value) => {
    const handle = (value || "").split("/products/")[1] || "";
    return handle.split("?")[0].split("#")[0].split("/")[0];
  };

  const normalizeMirrorUrl = (value) => {
    if (!value || /^(#|mailto:|tel:|javascript:)/i.test(value)) {
      return "";
    }

    let url;
    try {
      url = new URL(value, window.location.href);
    } catch {
      return "";
    }

    if (url.origin === window.location.origin && url.pathname.startsWith(`${basePath}/`)) {
      return `${url.pathname}${url.search}${url.hash}`;
    }

    const isBlueprintHost =
      url.hostname === "blueprint.bryanjohnson.com" ||
      url.hostname === "www.blueprint.bryanjohnson.com";
    const isSameOrigin = url.origin === window.location.origin;
    if (!isBlueprintHost && !isSameOrigin) {
      return "";
    }

    let pathname = url.pathname;
    if (pathname.startsWith(`${basePath}/`)) {
      pathname = pathname.slice(basePath.length);
    }

    if (pathname === "/" || pathname === "") {
      return `${basePath}/index.html${url.search}${url.hash}`;
    }

    if (pathname === "/cart" || pathname === "/cart/") {
      return `${basePath}/cart.html${url.search}${url.hash}`;
    }

    if (pathname === "/account" || pathname === "/account/") {
      return `${basePath}/account.html${url.search}${url.hash}`;
    }

    const productHandle = getProductHandle(pathname);
    if (productHandle) {
      return `${basePath}/products/${productHandle}.html${url.search}${url.hash}`;
    }

    if (/^\\/collections\\/[^/]+$/i.test(pathname) || /^\\/pages\\/[^/]+$/i.test(pathname)) {
      return `${basePath}${pathname}.html${url.search}${url.hash}`;
    }

    if (/^\\/blogs\\/.+/i.test(pathname) && !/\\.[a-z0-9]+$/i.test(pathname)) {
      return `${basePath}${pathname}.html${url.search}${url.hash}`;
    }

    if (!/\\.[a-z0-9]+$/i.test(pathname) && /^\\/[^?#]+$/.test(pathname)) {
      return `${basePath}${pathname}.html${url.search}${url.hash}`;
    }

    return `${basePath}${pathname}${url.search}${url.hash}`;
  };

  const normalizeHistoryUrl = (value) => {
    if (value == null) {
      return value;
    }

    if (value instanceof URL) {
      const normalizedUrl = normalizeMirrorUrl(value.toString());
      return normalizedUrl || value.toString();
    }

    if (typeof value !== "string") {
      return value;
    }

    const normalizedUrl = normalizeMirrorUrl(value);
    return normalizedUrl || value;
  };

  const wrapHistoryMethod = (methodName) => {
    const originalMethod = window.history[methodName];
    if (typeof originalMethod !== "function" || originalMethod.__localMirrorWrapped) {
      return;
    }

    const wrappedMethod = function (state, title, url) {
      return originalMethod.call(this, state, title, normalizeHistoryUrl(url));
    };
    wrappedMethod.__localMirrorWrapped = true;
    window.history[methodName] = wrappedMethod;
  };

  const ensureLocalSlider = () => {
    if (!document.querySelector(".x-splide")) {
      return;
    }

    if (window.Splide) {
      window.Eurus.loadedScript.add("slider");
      document.dispatchEvent(new CustomEvent("slider loaded"));
      return;
    }

    if (document.querySelector('script[data-local-splide-script="true"]')) {
      window.Eurus.loadedScript.add("slider");
      return;
    }

    window.Eurus.loadedScript.add("slider");
    const script = document.createElement("script");
    script.src = sliderScriptPath;
    script.defer = true;
    script.dataset.localSplideScript = "true";
    script.onload = () => document.dispatchEvent(new CustomEvent("slider loaded"));
    document.head.appendChild(script);
  };

  const ensureStylesheet = (href, marker) => {
    const markerAttr = marker.replace(/[A-Z]/g, (character) => `-${character.toLowerCase()}`);
    if (document.querySelector(`link[data-${markerAttr}="true"]`)) {
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset[marker] = "true";
    document.head.appendChild(link);
  };

  const ensureLocalCart = () => {
    ensureStylesheet(cartStylesPath, "localCartStylesheet");

    if (document.querySelector('script[data-local-cart-script="true"]')) {
      return;
    }

    const script = document.createElement("script");
    script.src = cartScriptPath;
    script.defer = true;
    script.dataset.localCartScript = "true";
    document.head.appendChild(script);
  };

  const rewriteAnchor = (anchor) => {
    const normalizedUrl = normalizeMirrorUrl(anchor.getAttribute("href"));
    if (normalizedUrl && anchor.getAttribute("href") !== normalizedUrl) {
      anchor.setAttribute("href", normalizedUrl);
    }
  };

  const rewriteAnchors = (node) => {
    if (!node) {
      return;
    }

    const anchors = node.querySelectorAll ? node.querySelectorAll("a[href]") : [];
    if (node.matches && node.matches("a[href]")) {
      rewriteAnchor(node);
    }
    anchors.forEach(rewriteAnchor);
  };

  const handleAnchorClick = (event) => {
    const anchor = event.target.closest("a[href]");
    if (!anchor) {
      return;
    }

    const normalizedUrl = normalizeMirrorUrl(anchor.getAttribute("href"));
    if (!normalizedUrl) {
      return;
    }

    if (anchor.getAttribute("href") !== normalizedUrl) {
      anchor.setAttribute("href", normalizedUrl);
    }

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      anchor.target === "_blank" ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    window.location.assign(normalizedUrl);
  };

  wrapHistoryMethod("replaceState");
  wrapHistoryMethod("pushState");

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        ensureLocalSlider();
        ensureLocalCart();
        rewriteAnchors(document);
      },
      { once: true }
    );
  } else {
    ensureLocalSlider();
    ensureLocalCart();
    rewriteAnchors(document);
  }

  document.addEventListener("click", handleAnchorClick, true);
  new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          rewriteAnchors(node);
        }
      });
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
"""


def normalize_url(url: str) -> str:
    parsed = urlparse(url)
    scheme = parsed.scheme or "https"
    netloc = parsed.netloc
    path = parsed.path or "/"
    query = urlencode(sorted(parse_qsl(parsed.query, keep_blank_values=True)))
    return urlunparse((scheme, netloc, path, "", query, ""))


def should_skip(url: str, allowed_hosts: set[str]) -> bool:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        return True
    if parsed.netloc not in allowed_hosts:
        return True
    if parsed.fragment:
        url = urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, parsed.query, ""))
        parsed = urlparse(url)
    return parsed.netloc == "blueprint.bryanjohnson.com" and parsed.path.startswith(SKIP_PATH_PREFIXES)


def guess_extension(content_type: str | None, url: str) -> str:
    if not content_type:
        return Path(urlparse(url).path).suffix
    base_type = content_type.split(";", 1)[0].strip().lower()
    guessed = mimetypes.guess_extension(base_type) or ""
    if guessed == ".jpe":
        return ".jpg"
    return guessed


def local_path_for_url(base_dir: Path, url: str, content_type: str | None = None) -> Path:
    parsed = urlparse(url)
    raw_path = parsed.path or "/"
    if raw_path.endswith("/"):
        raw_path = f"{raw_path}index.html"
    path = Path(raw_path.lstrip("/"))
    suffix = path.suffix
    if not suffix:
        suffix = guess_extension(content_type, url)
        path = path.with_suffix(suffix or ".html")
    if parsed.query:
        digest = hashlib.sha1(parsed.query.encode("utf-8")).hexdigest()[:12]
        path = path.with_name(f"{path.stem}__q_{digest}{path.suffix}")
    return base_dir / parsed.netloc / path


def relative_rewrite(from_path: Path, to_path: Path) -> str:
    return os.path.relpath(to_path, start=from_path.parent).replace(os.sep, "/")


class Mirror:
    def __init__(self, start_url: str, out_dir: Path, allowed_hosts: set[str], pause: float = 0.0) -> None:
        self.start_url = normalize_url(start_url)
        self.out_dir = out_dir
        self.allowed_hosts = allowed_hosts
        self.pause = pause
        self.queue: deque[str] = deque()
        self.visited: set[str] = set()
        self.saved: dict[str, Path] = {}
        self.failed: dict[str, str] = {}

    def request(self, url: str) -> tuple[bytes, str | None]:
        req = Request(url, headers={"User-Agent": USER_AGENT})
        with urlopen(req, timeout=30) as res:
            content_type = res.headers.get("Content-Type")
            return res.read(), content_type

    def enqueue(self, url: str) -> None:
        normalized = normalize_url(url)
        if normalized in self.visited or normalized in self.queue:
            return
        if should_skip(normalized, self.allowed_hosts):
            return
        self.queue.append(normalized)

    def fetch_sitemaps(self) -> None:
        sitemap_url = urljoin(self.start_url, "/sitemap.xml")
        try:
            payload, _ = self.request(sitemap_url)
        except Exception as exc:  # noqa: BLE001
            print(f"[warn] sitemap unavailable: {exc}", file=sys.stderr)
            self.enqueue(self.start_url)
            return

        root = ET.fromstring(payload)
        ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        sitemap_nodes = root.findall("sm:sitemap/sm:loc", ns)
        if sitemap_nodes:
            for node in sitemap_nodes:
                if node.text:
                    self._enqueue_sitemap_urls(node.text.strip())
        else:
            self._enqueue_urlset(root)

        self.enqueue(self.start_url)

    def _enqueue_sitemap_urls(self, sitemap_url: str) -> None:
        try:
            payload, _ = self.request(sitemap_url)
        except Exception as exc:  # noqa: BLE001
            print(f"[warn] sitemap {sitemap_url} failed: {exc}", file=sys.stderr)
            return
        root = ET.fromstring(payload)
        if root.tag.endswith("sitemapindex"):
            ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
            for node in root.findall("sm:sitemap/sm:loc", ns):
                if node.text:
                    self._enqueue_sitemap_urls(node.text.strip())
            return
        self._enqueue_urlset(root)

    def _enqueue_urlset(self, root: ET.Element) -> None:
        ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        for node in root.findall("sm:url/sm:loc", ns):
            if node.text:
                self.enqueue(node.text.strip())

    def crawl(self) -> None:
        self.fetch_sitemaps()
        while self.queue:
            url = self.queue.popleft()
            if url in self.visited:
                continue
            self.visited.add(url)
            print(f"[fetch] {url}")
            try:
                content, content_type = self.request(url)
                self._save_and_process(url, content, content_type)
            except Exception as exc:  # noqa: BLE001
                self.failed[url] = str(exc)
                print(f"[error] {url}: {exc}", file=sys.stderr)
            if self.pause:
                time.sleep(self.pause)

    def _save_and_process(self, url: str, content: bytes, content_type: str | None) -> None:
        target = local_path_for_url(self.out_dir, url, content_type)
        target.parent.mkdir(parents=True, exist_ok=True)

        if self._is_html(url, content_type):
            text = content.decode("utf-8", errors="replace")
            rewritten = self._rewrite_html(url, target, text)
            target.write_text(rewritten, encoding="utf-8")
        elif self._is_css(url, content_type):
            text = content.decode("utf-8", errors="replace")
            rewritten = self._rewrite_css(url, target, text)
            target.write_text(rewritten, encoding="utf-8")
        else:
            target.write_bytes(content)

        self.saved[url] = target

    def _is_html(self, url: str, content_type: str | None) -> bool:
        parsed = urlparse(url)
        suffix = Path(parsed.path).suffix.lower()
        if content_type and content_type.startswith("text/html"):
            return True
        return suffix in HTML_EXTENSIONS

    def _is_css(self, url: str, content_type: str | None) -> bool:
        parsed = urlparse(url)
        if content_type and content_type.startswith("text/css"):
            return True
        return parsed.path.lower().endswith(".css")

    def _rewrite_html(self, page_url: str, page_path: Path, html: str) -> str:
        html = HTML_SRCSET_ATTR_RE.sub(
            lambda match: self._replace_attr_match(match, page_url, page_path, "srcset"),
            html,
        )
        html = HTML_STYLE_ATTR_RE.sub(
            lambda match: self._replace_attr_match(match, page_url, page_path, "style"),
            html,
        )
        html = HTML_URL_ATTR_RE.sub(
            lambda match: self._replace_attr_match(match, page_url, page_path, "url"),
            html,
        )
        # Some storefront markup ships with a non-standard img `size` attribute;
        # browsers are more reliable with the standard `sizes` attribute.
        html = HTML_IMG_SIZE_ATTR_RE.sub(r"\1sizes=", html)
        html = SLIDER_SCRIPT_RE.sub(
            lambda match: self._replace_slider_script(match, page_url, page_path),
            html,
        )
        html = self._inject_collection_sort_script(page_url, page_path, html)
        return html

    def _rewrite_css(self, page_url: str, page_path: Path, css: str) -> str:
        return self._rewrite_css_block(page_url, page_path, css)

    def _rewrite_css_block(self, page_url: str, page_path: Path, css: str) -> str:
        def replace(match: re.Match[str]) -> str:
            quote = match.group(1)
            raw_value = match.group(2).strip()
            rewritten = self._rewrite_url_value(page_url, page_path, raw_value)
            return f"url({quote}{rewritten}{quote})"

        return CSS_URL_RE.sub(replace, css)

    def _rewrite_srcset(self, page_url: str, page_path: Path, srcset: str) -> str:
        items = []
        for chunk in SRCSET_SPLIT_RE.split(srcset.strip()):
            if not chunk:
                continue
            parts = chunk.split()
            target = parts[0]
            descriptor = "" if len(parts) == 1 else " " + " ".join(parts[1:])
            rewritten = self._rewrite_url_value(page_url, page_path, target)
            items.append(f"{rewritten}{descriptor}")
        return ", ".join(items)

    def _replace_attr_match(
        self,
        match: re.Match[str],
        page_url: str,
        page_path: Path,
        kind: str,
    ) -> str:
        value = match.group("value")
        if kind == "srcset":
            rewritten = self._rewrite_srcset(page_url, page_path, value)
        elif kind == "style":
            rewritten = self._rewrite_css_block(page_url, page_path, value)
        else:
            rewritten = self._rewrite_url_value(page_url, page_path, value)
        return f"{match.group('prefix')}{match.group('quote')}{rewritten}{match.group('quote')}"

    def _replace_slider_script(self, match: re.Match[str], page_url: str, page_path: Path) -> str:
        rewritten = self._rewrite_url_value(page_url, page_path, match.group("value"))
        return f"sliderScript: {match.group('quote')}{rewritten}{match.group('quote')}"

    def _inject_collection_sort_script(self, page_url: str, page_path: Path, html: str) -> str:
        parsed = urlparse(page_url)
        if parsed.netloc != "blueprint.bryanjohnson.com" or parsed.path not in COLLECTION_SORT_PAGE_PATHS:
            return html

        asset_path = self.out_dir / COLLECTION_SORT_RELATIVE_PATH
        script_src = relative_rewrite(page_path, asset_path)
        if script_src in html:
            return html

        script_tag = f'<script src="{script_src}" defer></script>'
        return COLLECTION_SORT_SCRIPT_RE.sub(
            lambda match: f"{match.group(0)}\n{script_tag}",
            html,
            count=1,
        )

    def _rewrite_url_value(self, page_url: str, page_path: Path, value: str) -> str:
        value = value.strip()
        if not value or value.startswith(("data:", "javascript:", "mailto:", "tel:", "#")):
            return value

        absolute = urljoin(page_url, value)
        normalized = normalize_url(absolute)
        if should_skip(normalized, self.allowed_hosts):
            return value

        self.enqueue(normalized)
        target = local_path_for_url(self.out_dir, normalized)
        return relative_rewrite(page_path, target)

    def write_summary(self) -> None:
        summary = self.out_dir / "mirror-summary.txt"
        lines = [
            f"saved={len(self.saved)}",
            f"failed={len(self.failed)}",
            "",
            "[saved]",
        ]
        lines.extend(f"{url} -> {path}" for url, path in sorted(self.saved.items()))
        if self.failed:
            lines.append("")
            lines.append("[failed]")
            lines.extend(f"{url} :: {error}" for url, error in sorted(self.failed.items()))
        summary.write_text("\n".join(lines), encoding="utf-8")


def parse_args(argv: Iterable[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Mirror a public Shopify storefront for local experimentation.")
    parser.add_argument("--start-url", default=DEFAULT_START)
    parser.add_argument("--out-dir", default="mirror")
    parser.add_argument(
        "--allow-host",
        action="append",
        default=[],
        help="Additional hostnames to allow. Can be passed multiple times.",
    )
    parser.add_argument("--pause", type=float, default=0.0, help="Pause between requests in seconds.")
    parser.add_argument(
        "--skip-sitemaps",
        action="store_true",
        help="Start from the provided URL only and discover linked assets/pages from there.",
    )
    return parser.parse_args(list(argv))


def install_local_support_files(out_dir: Path, saved: dict[str, Path]) -> None:
    if not COLLECTION_SORT_SOURCE_PATH.exists():
        collection_sort_available = False
    else:
        collection_sort_available = True

    if collection_sort_available:
        target_path = out_dir / COLLECTION_SORT_RELATIVE_PATH
        target_path.parent.mkdir(parents=True, exist_ok=True)
        target_path.write_text(COLLECTION_SORT_SOURCE_PATH.read_text(encoding="utf-8"), encoding="utf-8")

    if ACCOUNT_MOCK_HTML_SOURCE_PATH.exists():
        account_mock_html = ACCOUNT_MOCK_HTML_SOURCE_PATH.read_text(encoding="utf-8")
        for relative_path in ACCOUNT_MOCK_PAGE_RELATIVE_PATHS:
            target_path = out_dir / relative_path
            target_path.parent.mkdir(parents=True, exist_ok=True)
            target_path.write_text(account_mock_html, encoding="utf-8")

    for source_path, relative_path in ACCOUNT_MOCK_ASSET_TARGETS:
        if not source_path.exists():
            continue
        target_path = out_dir / relative_path
        target_path.parent.mkdir(parents=True, exist_ok=True)
        target_path.write_text(source_path.read_text(encoding="utf-8"), encoding="utf-8")

    if CART_MOCK_HTML_SOURCE_PATH.exists():
        cart_mock_html = CART_MOCK_HTML_SOURCE_PATH.read_text(encoding="utf-8")
        for relative_path in CART_MOCK_PAGE_RELATIVE_PATHS:
            target_path = out_dir / relative_path
            target_path.parent.mkdir(parents=True, exist_ok=True)
            target_path.write_text(cart_mock_html, encoding="utf-8")

    for source_path, relative_path in CART_MOCK_ASSET_TARGETS:
        if not source_path.exists():
            continue
        target_path = out_dir / relative_path
        target_path.parent.mkdir(parents=True, exist_ok=True)
        target_path.write_text(source_path.read_text(encoding="utf-8"), encoding="utf-8")

    for relative_path in (LOCAL_SEARCH_ROOT_RELATIVE_PATH, LOCAL_SEARCH_PAGE_RELATIVE_PATH):
        target_path = out_dir / relative_path
        target_path.parent.mkdir(parents=True, exist_ok=True)
        target_path.write_text(LOCAL_SEARCH_REDIRECT_HTML, encoding="utf-8")

    for url, source_path in saved.items():
        if urlparse(url).path.endswith("/assets/splide4.1.3.js"):
            alias_target_path = out_dir / LOCAL_SPLIDE_ALIAS_RELATIVE_PATH
            alias_target_path.parent.mkdir(parents=True, exist_ok=True)
            alias_target_path.write_bytes(source_path.read_bytes())
            break


def patch_theme_assets(saved: dict[str, Path]) -> None:
    for url, path in saved.items():
        if not urlparse(url).path.endswith("/assets/theme.js"):
            continue

        contents = path.read_text(encoding="utf-8")
        if LOCAL_SPLIDE_THEME_SNIPPET.strip() in contents:
            continue

        path.write_text(f"{contents}{LOCAL_SPLIDE_THEME_SNIPPET}", encoding="utf-8")


def main(argv: Iterable[str]) -> int:
    args = parse_args(argv)
    allowed_hosts = set(DEFAULT_ALLOWED_HOSTS)
    allowed_hosts.update(args.allow_host)

    out_dir = Path(args.out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    mirror = Mirror(args.start_url, out_dir, allowed_hosts, pause=args.pause)
    if args.skip_sitemaps:
        mirror.enqueue(args.start_url)
        while mirror.queue:
            url = mirror.queue.popleft()
            if url in mirror.visited:
                continue
            mirror.visited.add(url)
            print(f"[fetch] {url}")
            try:
                content, content_type = mirror.request(url)
                mirror._save_and_process(url, content, content_type)
            except Exception as exc:  # noqa: BLE001
                mirror.failed[url] = str(exc)
                print(f"[error] {url}: {exc}", file=sys.stderr)
            if mirror.pause:
                time.sleep(mirror.pause)
    else:
        mirror.crawl()
    install_local_support_files(out_dir, mirror.saved)
    patch_theme_assets(mirror.saved)
    mirror.write_summary()

    index_path = local_path_for_url(out_dir, normalize_url(args.start_url), "text/html")
    print("")
    print(f"Saved {len(mirror.saved)} files to {out_dir}")
    print(f"Failed {len(mirror.failed)} URLs")
    print(f"Open {index_path}")
    return 0 if not mirror.failed else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
