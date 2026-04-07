"use client";

import { useState } from "react";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/types";

type Tab = {
  handle: string;
  label: string;
  description: string;
  products: Product[];
};

export function HomeCollectionShowcase({ tabs }: { tabs: Tab[] }) {
  const [activeHandle, setActiveHandle] = useState(tabs[0]?.handle ?? "");
  const activeTab = tabs.find((tab) => tab.handle === activeHandle) ?? tabs[0];

  if (!activeTab) {
    return null;
  }

  return (
    <section className="shell page-section">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Every product is designed for every body</p>
          <h2>Shop by outcome.</h2>
        </div>
        <p className="section-copy">
          Move from daily essentials to more targeted support without losing the simplicity of the routine.
        </p>
      </div>

      <div className="tab-list" role="tablist" aria-label="Collection showcase">
        {tabs.map((tab) => (
          <button
            key={tab.handle}
            type="button"
            className={`tab-list__button ${tab.handle === activeTab.handle ? "is-active" : ""}`}
            onClick={() => setActiveHandle(tab.handle)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className="section-copy section-copy--narrow">{activeTab.description}</p>

      <div className="product-grid">
        {activeTab.products.slice(0, 5).map((product) => (
          <ProductCard key={product.handle} product={product} />
        ))}
      </div>
    </section>
  );
}
