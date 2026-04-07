"use client";

import { useState } from "react";
import Link from "next/link";

type StandardsFeatureItem = {
  title: string;
  description: string;
};

type StandardsFeatureContent = {
  eyebrow: string;
  heading: string;
  description: string;
  title: string;
  resultsLabel: string;
  resultsHref: string;
  footnote: string;
  image: {
    src: string;
    alt: string;
  };
  capsuleImage: {
    src: string;
    alt: string;
  };
  items: readonly StandardsFeatureItem[];
};

type StandardsFeatureProps = {
  content: StandardsFeatureContent;
};

export function StandardsFeature({ content }: StandardsFeatureProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="standards-feature shell page-section">
      <div className="standards-feature__grid">
        <div className="standards-feature__copy">
          <p className="eyebrow standards-feature__eyebrow">{content.eyebrow}</p>
          <h2>{content.heading}</h2>
          <p className="standards-feature__description">{content.description}</p>

          <div className="standards-feature__items">
            {content.items.map((item, index) => (
              <button
                key={item.title}
                className="standards-feature__item"
                type="button"
                aria-expanded={activeIndex === index}
                onClick={() => setActiveIndex(index)}
              >
                <span className="standards-feature__summary">
                  <span className="standards-feature__item-title">{item.title}</span>
                  <span className="standards-feature__item-copy" aria-hidden={activeIndex !== index}>
                    {activeIndex === index ? item.description : ""}
                  </span>
                  <span aria-hidden="true" className="standards-feature__plus">
                    +
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="standards-feature__visual-column">
          <div className="standards-feature__visual" aria-hidden="true">
            <div className="standards-feature__image-wrap">
              <img
                src={content.image.src}
                alt={content.image.alt}
                className="standards-feature__image"
              />
            </div>
            <img
              src={content.capsuleImage.src}
              alt={content.capsuleImage.alt}
              className="standards-feature__capsule"
            />
          </div>

          <div className="standards-feature__standards-card">
            <p className="eyebrow standards-feature__standards-eyebrow">{content.title}</p>
            <Link href={content.resultsHref} className="standards-feature__link">
              {content.resultsLabel}
            </Link>
            <p className="standards-feature__footnote">{content.footnote}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
