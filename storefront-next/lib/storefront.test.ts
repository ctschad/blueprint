import { describe, expect, it } from "vitest";
import { searchCatalog, sortProducts, getProductsForCollection } from "@/lib/storefront";

describe("storefront smoke checks", () => {
  it("finds a known product match for a stable catalog query", () => {
    const results = searchCatalog("green");

    expect(results.products.some((product) => product.handle === "ceremonial-matcha")).toBe(true);
  });

  it("finds a known article match for a stable content query", () => {
    const results = searchCatalog("recipes");

    expect(results.articles.some((article) => article.title === "Three Blueprint Meal Recipes")).toBe(true);
  });

  it("sorts collection products by ascending price", () => {
    const products = getProductsForCollection("all-products").slice(0, 12);
    const sorted = sortProducts(products, "price-asc");

    for (let index = 1; index < sorted.length; index += 1) {
      expect(sorted[index - 1]?.priceMin ?? 0).toBeLessThanOrEqual(sorted[index]?.priceMin ?? 0);
    }
  });

  it("sorts collection products by newest first", () => {
    const products = getProductsForCollection("all-products").slice(0, 12);
    const sorted = sortProducts(products, "newest");

    for (let index = 1; index < sorted.length; index += 1) {
      expect(sorted[index - 1]?.id ?? 0).toBeGreaterThanOrEqual(sorted[index]?.id ?? 0);
    }
  });
});
