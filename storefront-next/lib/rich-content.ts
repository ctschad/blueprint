import { parseFragment, type DefaultTreeAdapterMap } from "parse5";
import type { ProductImage, RichContentBlock, RichTextNode } from "@/lib/types";

type HtmlNode = DefaultTreeAdapterMap["childNode"];
type HtmlElement = DefaultTreeAdapterMap["element"];
type HtmlTextNode = DefaultTreeAdapterMap["textNode"];

const BLOCK_TAGS = new Set([
  "address",
  "article",
  "aside",
  "blockquote",
  "div",
  "dl",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hr",
  "img",
  "li",
  "main",
  "nav",
  "ol",
  "p",
  "section",
  "table",
  "ul"
]);

function isElementNode(node: HtmlNode): node is HtmlElement {
  return "tagName" in node;
}

function isTextNode(node: HtmlNode): node is HtmlTextNode {
  return node.nodeName === "#text";
}

function getAttribute(node: HtmlElement, name: string) {
  return node.attrs.find((attribute) => attribute.name === name)?.value ?? "";
}

function getClassList(node: HtmlElement) {
  return getAttribute(node, "class")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function hasClass(node: HtmlElement, className: string) {
  return getClassList(node).includes(className);
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function normalizeWhitespace(value: string) {
  return decodeHtmlEntities(value).replace(/\s+/g, " ");
}

function sanitizeHref(rawHref: string) {
  const href = decodeHtmlEntities(rawHref.trim());

  if (!href) {
    return null;
  }

  if (
    href.startsWith("/") ||
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("https://") ||
    href.startsWith("http://")
  ) {
    return href;
  }

  return null;
}

function sanitizeImageSrc(rawSrc: string) {
  const src = decodeHtmlEntities(rawSrc.trim());
  if (!src) {
    return null;
  }

  if (src.startsWith("/") || src.startsWith("https://") || src.startsWith("http://") || src.startsWith("data:image/")) {
    return src;
  }

  return null;
}

function compactInlineNodes(nodes: RichTextNode[]) {
  const compacted: RichTextNode[] = [];

  for (const node of nodes) {
    if (node.type === "text") {
      const text = node.text.replace(/\s+/g, " ").trim();
      if (!text) {
        continue;
      }

      const previous = compacted[compacted.length - 1];
      if (previous?.type === "text") {
        previous.text = `${previous.text} ${text}`.replace(/\s+/g, " ").trim();
      } else {
        compacted.push({ type: "text", text });
      }
      continue;
    }

    compacted.push(node);
  }

  return compacted;
}

function getTextContent(node: HtmlNode): string {
  if (isTextNode(node)) {
    return normalizeWhitespace(node.value).trim();
  }

  if (!isElementNode(node)) {
    return "";
  }

  return node.childNodes.map(getTextContent).join(" ").replace(/\s+/g, " ").trim();
}

function collectInlineNodes(nodes: HtmlNode[]): RichTextNode[] {
  const inlineNodes: RichTextNode[] = [];

  for (const node of nodes) {
    if (isTextNode(node)) {
      const text = normalizeWhitespace(node.value);
      if (text.trim()) {
        inlineNodes.push({ type: "text", text });
      }
      continue;
    }

    if (!isElementNode(node)) {
      continue;
    }

    const tagName = node.tagName.toLowerCase();

    if (tagName === "script" || tagName === "style" || tagName === "iframe" || tagName === "meta") {
      continue;
    }

    if (tagName === "br") {
      inlineNodes.push({ type: "lineBreak" });
      continue;
    }

    if (tagName === "strong" || tagName === "b") {
      const children = collectInlineNodes(node.childNodes);
      if (children.length) {
        inlineNodes.push({ type: "strong", children });
      }
      continue;
    }

    if (tagName === "em" || tagName === "i") {
      const children = collectInlineNodes(node.childNodes);
      if (children.length) {
        inlineNodes.push({ type: "emphasis", children });
      }
      continue;
    }

    if (tagName === "code") {
      const children = collectInlineNodes(node.childNodes);
      if (children.length) {
        inlineNodes.push({ type: "code", children });
      }
      continue;
    }

    if (tagName === "sup") {
      const children = collectInlineNodes(node.childNodes);
      if (children.length) {
        inlineNodes.push({ type: "superscript", children });
      }
      continue;
    }

    if (tagName === "sub") {
      const children = collectInlineNodes(node.childNodes);
      if (children.length) {
        inlineNodes.push({ type: "subscript", children });
      }
      continue;
    }

    if (tagName === "a") {
      const href = sanitizeHref(getAttribute(node, "href"));
      const children = collectInlineNodes(node.childNodes);
      if (href && children.length) {
        inlineNodes.push({
          type: "link",
          href,
          external: !href.startsWith("/") && !href.startsWith("#"),
          children
        });
      } else {
        inlineNodes.push(...children);
      }
      continue;
    }

    if (tagName === "img") {
      continue;
    }

    inlineNodes.push(...collectInlineNodes(node.childNodes));
  }

  return compactInlineNodes(inlineNodes);
}

function createParagraph(children: RichTextNode[]): RichContentBlock[] {
  const compacted = compactInlineNodes(children);
  return compacted.length ? [{ type: "paragraph", children: compacted }] : [];
}

function createImageBlockFromElement(node: HtmlElement): RichContentBlock[] {
  const src = sanitizeImageSrc(getAttribute(node, "src"));
  if (!src) {
    return [];
  }

  return [
    {
      type: "image",
      src,
      alt: decodeHtmlEntities(getAttribute(node, "alt"))
    }
  ];
}

function createImageBlocksFromParagraph(node: HtmlElement): RichContentBlock[] {
  const imageElements = node.childNodes.filter(
    (child): child is HtmlElement => isElementNode(child) && child.tagName.toLowerCase() === "img"
  );
  const nonImageChildren = node.childNodes.filter(
    (child) => !isElementNode(child) || child.tagName.toLowerCase() !== "img"
  );

  if (imageElements.length === 0) {
    return createParagraph(collectInlineNodes(node.childNodes));
  }

  const imageBlocks = imageElements.flatMap((imageElement) => createImageBlockFromElement(imageElement));
  const inlineBlocks = createParagraph(collectInlineNodes(nonImageChildren));

  return [...imageBlocks, ...inlineBlocks];
}

function collectBlocks(nodes: HtmlNode[]): RichContentBlock[] {
  const blocks: RichContentBlock[] = [];
  let inlineBuffer: HtmlNode[] = [];

  const flushInlineBuffer = () => {
    if (inlineBuffer.length === 0) {
      return;
    }

    blocks.push(...createParagraph(collectInlineNodes(inlineBuffer)));
    inlineBuffer = [];
  };

  for (const node of nodes) {
    if (isTextNode(node)) {
      if (normalizeWhitespace(node.value).trim()) {
        inlineBuffer.push(node);
      }
      continue;
    }

    if (!isElementNode(node)) {
      continue;
    }

    const tagName = node.tagName.toLowerCase();

    if (tagName === "script" || tagName === "style" || tagName === "meta" || tagName === "iframe") {
      continue;
    }

    if (!BLOCK_TAGS.has(tagName)) {
      inlineBuffer.push(...node.childNodes);
      continue;
    }

    flushInlineBuffer();
    blocks.push(...collectBlocksFromElement(node));
  }

  flushInlineBuffer();
  return blocks;
}

function collectBlocksFromListItem(node: HtmlElement) {
  const blocks = collectBlocks(node.childNodes);
  return blocks.length ? blocks : createParagraph(collectInlineNodes(node.childNodes));
}

function collectTableRows(node: HtmlElement) {
  return node.childNodes
    .filter((child): child is HtmlElement => isElementNode(child) && child.tagName.toLowerCase() === "tr")
    .map((row) =>
      row.childNodes
        .filter((child): child is HtmlElement => isElementNode(child) && ["td", "th"].includes(child.tagName.toLowerCase()))
        .map((cell) => {
          const blocks = collectBlocks(cell.childNodes);
          return blocks.length ? blocks : createParagraph(collectInlineNodes(cell.childNodes));
        })
    )
    .filter((row) => row.length > 0);
}

function findFirstDescendant(node: HtmlElement, matcher: (element: HtmlElement) => boolean): HtmlElement | null {
  for (const child of node.childNodes) {
    if (!isElementNode(child)) {
      continue;
    }

    if (matcher(child)) {
      return child;
    }

    const nested = findFirstDescendant(child, matcher);
    if (nested) {
      return nested;
    }
  }

  return null;
}

function createInstagramEmbedBlock(node: HtmlElement): RichContentBlock[] {
  const eyebrow = findFirstDescendant(node, (element) => hasClass(element, "article-embed__eyebrow"));
  const title = findFirstDescendant(node, (element) => hasClass(element, "article-embed__title"));
  const copy = findFirstDescendant(node, (element) => hasClass(element, "article-embed__copy"));
  const button = findFirstDescendant(
    node,
    (element) => hasClass(element, "article-embed__button") && element.tagName.toLowerCase() === "a"
  );

  const href = button ? sanitizeHref(getAttribute(button, "href")) : null;
  if (!href) {
    return [];
  }

  return [
    {
      type: "embed",
      kind: "instagram",
      eyebrow: eyebrow ? getTextContent(eyebrow) : undefined,
      title: title ? getTextContent(title) : "View the original post",
      copy: copy ? getTextContent(copy) : undefined,
      href,
      ctaLabel: button ? getTextContent(button) : "Open on Instagram"
    }
  ];
}

function createSnapshotBlock(node: HtmlElement): RichContentBlock[] {
  const left = node.childNodes.find(
    (child): child is HtmlElement => isElementNode(child) && hasClass(child, "left")
  );
  const right = node.childNodes.find(
    (child): child is HtmlElement => isElementNode(child) && hasClass(child, "right")
  );

  if (!left || !right) {
    return collectBlocks(node.childNodes);
  }

  const imageNode = findFirstDescendant(left, (element) => element.tagName.toLowerCase() === "img");
  const titleNode = right.childNodes.find(
    (child): child is HtmlElement =>
      isElementNode(child) && ["h1", "h2", "h3", "h4", "h5", "h6"].includes(child.tagName.toLowerCase())
  );

  const contentNodes = right.childNodes.filter((child) => child !== titleNode);
  const body = collectBlocks(contentNodes);
  const image: ProductImage | null =
    imageNode && sanitizeImageSrc(getAttribute(imageNode, "src"))
      ? {
          src: sanitizeImageSrc(getAttribute(imageNode, "src"))!,
          alt: decodeHtmlEntities(getAttribute(imageNode, "alt"))
        }
      : null;

  return [
    {
      type: "snapshot",
      title: titleNode ? getTextContent(titleNode) : undefined,
      body,
      image,
      reversed: hasClass(node, "reversed-section")
    }
  ];
}

function collectBlocksFromElement(node: HtmlElement): RichContentBlock[] {
  const tagName = node.tagName.toLowerCase();

  if (hasClass(node, "article-embed--instagram")) {
    return createInstagramEmbedBlock(node);
  }

  if (hasClass(node, "snapshot-section")) {
    return createSnapshotBlock(node);
  }

  if (/^h[1-6]$/.test(tagName)) {
    return [
      {
        type: "heading",
        level: Number.parseInt(tagName.slice(1), 10) as 1 | 2 | 3 | 4 | 5 | 6,
        children: compactInlineNodes(collectInlineNodes(node.childNodes))
      }
    ];
  }

  if (tagName === "p") {
    return createImageBlocksFromParagraph(node);
  }

  if (tagName === "ul" || tagName === "ol") {
    const items = node.childNodes
      .filter((child): child is HtmlElement => isElementNode(child) && child.tagName.toLowerCase() === "li")
      .map((item) => collectBlocksFromListItem(item))
      .filter((item) => item.length > 0);

    return items.length
      ? [
          {
            type: "list",
            ordered: tagName === "ol",
            items
          }
        ]
      : [];
  }

  if (tagName === "img") {
    return createImageBlockFromElement(node);
  }

  if (tagName === "figure") {
    const imageNode = node.childNodes.find(
      (child): child is HtmlElement => isElementNode(child) && child.tagName.toLowerCase() === "img"
    );
    const captionNode = node.childNodes.find(
      (child): child is HtmlElement => isElementNode(child) && child.tagName.toLowerCase() === "figcaption"
    );
    const imageBlocks = imageNode ? createImageBlockFromElement(imageNode) : [];

    if (imageBlocks.length && captionNode && imageBlocks[0]?.type === "image") {
      imageBlocks[0] = {
        ...imageBlocks[0],
        caption: compactInlineNodes(collectInlineNodes(captionNode.childNodes))
      };
    }

    return imageBlocks;
  }

  if (tagName === "blockquote") {
    const blocks = collectBlocks(node.childNodes);
    return blocks.length ? [{ type: "quote", blocks }] : [];
  }

  if (tagName === "hr") {
    return [{ type: "divider" }];
  }

  if (tagName === "table") {
    const thead = node.childNodes.find(
      (child): child is HtmlElement => isElementNode(child) && child.tagName.toLowerCase() === "thead"
    );
    const tbody = node.childNodes.find(
      (child): child is HtmlElement => isElementNode(child) && child.tagName.toLowerCase() === "tbody"
    );
    const rowsSource = tbody ?? node;
    const rows = collectTableRows(rowsSource);
    const head = thead ? collectTableRows(thead) : null;

    return rows.length || head?.length
      ? [
          {
            type: "table",
            head: head && head.length ? head : null,
            rows
          }
        ]
      : [];
  }

  return collectBlocks(node.childNodes);
}

export function htmlToRichContent(markup: string): RichContentBlock[] {
  const fragment = parseFragment(markup);
  return collectBlocks(fragment.childNodes);
}

export function richContentToPlainText(blocks: RichContentBlock[]) {
  const pieces: string[] = [];

  function visitInline(nodes: RichTextNode[]) {
    for (const node of nodes) {
      if (node.type === "text") {
        pieces.push(node.text);
      } else if (node.type === "lineBreak") {
        pieces.push(" ");
      } else {
        visitInline(node.children);
      }
    }
  }

  function visitBlocks(items: RichContentBlock[]) {
    for (const block of items) {
      switch (block.type) {
        case "paragraph":
        case "heading":
          visitInline(block.children);
          pieces.push(" ");
          break;
        case "list":
          block.items.forEach(visitBlocks);
          break;
        case "image":
          if (block.caption) {
            visitInline(block.caption);
            pieces.push(" ");
          }
          break;
        case "quote":
          visitBlocks(block.blocks);
          break;
        case "table":
          block.head?.forEach((row) => row.forEach(visitBlocks));
          block.rows.forEach((row) => row.forEach(visitBlocks));
          break;
        case "embed":
          pieces.push(block.title, " ", block.copy ?? "", " ");
          break;
        case "snapshot":
          if (block.title) {
            pieces.push(block.title, " ");
          }
          visitBlocks(block.body);
          break;
        default:
          break;
      }
    }
  }

  visitBlocks(blocks);
  return pieces.join(" ").replace(/\s+/g, " ").trim();
}
