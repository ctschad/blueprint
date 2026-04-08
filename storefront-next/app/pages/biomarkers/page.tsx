import { readFileSync } from "node:fs";
import path from "node:path";
import { MirroredHtmlFrame } from "@/components/mirrored-html-frame";

const MIRROR_ROOT = "/Users/charlesschad/Documents/GitHub/Blueprint/mirror/blueprint.bryanjohnson.com";
const MIRROR_HTML_PATH = path.join(MIRROR_ROOT, "pages/biomarkers.html");
const MIRROR_ASSETS_PATH = path.join(MIRROR_ROOT, "cdn/shop/t/445/assets");

function escapeStyleMarkup(value: string) {
  return value.replaceAll("</style>", "<\\/style>");
}

function inlineMirrorCssLinks(markup: string) {
  return markup.replace(
    /<link[^>]+href="\.\.\/cdn\/shop\/t\/445\/assets\/([^"]+\.css)"[^>]*>/gi,
    (_match, fileName: string) => {
      const cssPath = path.join(MIRROR_ASSETS_PATH, fileName);
      const css = readFileSync(cssPath, "utf8");

      return `<style data-mirror-asset="${fileName}">${escapeStyleMarkup(css)}</style>`;
    }
  );
}

function inlineMirrorSvgAssets(markup: string) {
  return markup.replace(/\.\.\/cdn\/shop\/t\/445\/assets\/([^"' )]+\.svg)/gi, (_match, fileName: string) => {
    const svgPath = path.join(MIRROR_ASSETS_PATH, fileName);
    const svg = readFileSync(svgPath, "utf8");
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

function rewriteInternalMirrorLinks(markup: string) {
  return markup
    .replace(/href="\.\.\/index\.html"/gi, 'href="/"')
    .replace(/href="build-my-stack\.html"/gi, 'href="/pages/build-my-stack"')
    .replace(/href="find-my-protocol\.html"/gi, 'href="/pages/protocol-quiz"')
    .replace(/href="coas\.html"/gi, 'href="/pages/coas"')
    .replace(/href="about\.html"/gi, 'href="/pages/about"')
    .replace(/href="\.\.\/blogs\/news\.html"/gi, 'href="/blogs/news"')
    .replace(/href="\.\.\/collections\/([^"]+)\.html"/gi, 'href="/collections/$1"')
    .replace(/href="\.\.\/products\/([^"]+)\.html"/gi, 'href="/products/$1"')
    .replace(/href="\.\.\/blogs\/news\/([^"]+)\.html"/gi, 'href="/blogs/news/$1"');
}

function buildBiomarkersHtml() {
  let html = readFileSync(MIRROR_HTML_PATH, "utf8");

  html = html
    .replace(/class="([^"]*)\bno-js\b([^"]*)"/i, 'class="$1js$2"')
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<link[^>]+rel="preconnect"[^>]*>/gi, "")
    .replace(/\.\.\/cdn\/shop\/files\//gi, "/cdn/shop/files/")
    .replace(/\.\.\/cdn\/fonts\//gi, "https://blueprint.bryanjohnson.com/cdn/fonts/")
    .replace(/https:\/\/blueprint\.bryanjohnson\.com\/cdn\/shop\/files\//gi, "/cdn/shop/files/")
    .replace(/(?<!https:)\/\/blueprint\.bryanjohnson\.com\/cdn\/shop\/files\//gi, "/cdn/shop/files/")
    .replace(/https:\/\/cdn\.shopify\.com\/s\/files\/1\/0772\/3129\/2701\/files\//gi, "/cdn/shop/files/")
    .replace(/https:\/\/blueprint\.bryanjohnson\.com\/index\.html/gi, "/")
    .replace(/https:\/\/blueprint\.bryanjohnson\.com\/pages\/biomarkers/gi, "/pages/biomarkers")
    .replace(/href="biomarkers\.html"/gi, 'href="/pages/biomarkers"');

  html = inlineMirrorCssLinks(html);
  html = inlineMirrorSvgAssets(html);
  html = rewriteInternalMirrorLinks(html);

  return html;
}

export default function BiomarkersPage() {
  return (
    <div className="mirrored-page mirrored-page--fullscreen">
      <MirroredHtmlFrame html={buildBiomarkersHtml()} title="Biomarkers" />
    </div>
  );
}
