import { describe, expect, it } from "vitest";
import { htmlToRichContent, richContentToPlainText } from "@/lib/rich-content";

describe("htmlToRichContent", () => {
  it("drops unsafe tags and inline event handlers while preserving safe content", () => {
    const blocks = htmlToRichContent(`
      <p onclick="alert('xss')">Hello <strong>world</strong>.</p>
      <script>alert("xss")</script>
      <img src="/cdn/shop/files/example.webp" alt="Example" onerror="alert('xss')" />
    `);

    expect(blocks).toEqual([
      {
        type: "paragraph",
        children: [
          { type: "text", text: "Hello" },
          {
            type: "strong",
            children: [{ type: "text", text: "world" }]
          },
          { type: "text", text: "." }
        ]
      },
      {
        type: "image",
        src: "/cdn/shop/files/example.webp",
        alt: "Example"
      }
    ]);
  });

  it("converts instagram fallback markup into a controlled embed block", () => {
    const blocks = htmlToRichContent(`
      <section class="article-embed article-embed--instagram">
        <p class="article-embed__eyebrow">Instagram</p>
        <h2 class="article-embed__title">Travel update</h2>
        <p class="article-embed__copy">See the original post.</p>
        <a class="article-embed__button" href="https://instagram.com/p/example">Open on Instagram</a>
      </section>
    `);

    expect(blocks).toEqual([
      {
        type: "embed",
        kind: "instagram",
        eyebrow: "Instagram",
        title: "Travel update",
        copy: "See the original post.",
        href: "https://instagram.com/p/example",
        ctaLabel: "Open on Instagram"
      }
    ]);
  });
});

describe("richContentToPlainText", () => {
  it("flattens block content into searchable plain text", () => {
    const blocks = htmlToRichContent(`
      <h2>Blueprint Biomarkers</h2>
      <p>Tracks cortisol and vitamin D.</p>
      <ul><li>Secure uploads</li><li>Retest in six months</li></ul>
    `);

    expect(richContentToPlainText(blocks)).toBe(
      "Blueprint Biomarkers Tracks cortisol and vitamin D. Secure uploads Retest in six months"
    );
  });
});
