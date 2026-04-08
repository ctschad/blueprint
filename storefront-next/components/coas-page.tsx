"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CoaCategory, CoaPageData } from "@/lib/types";

const CATEGORY_OPTIONS: Array<{
  value: CoaCategory;
  label: string;
}> = [
  { value: "all", label: "View All" },
  { value: "nutrition", label: "Nutrition" },
  { value: "supplements", label: "Supplements" },
  { value: "skincare", label: "Skincare" },
  { value: "haircare", label: "Haircare" }
];

function CoaBadge({ tone, label }: { tone: "blueprint" | "tested"; label: string }) {
  return (
    <span className={`coas-card__badge coas-card__badge--${tone}`}>
      <span className="coas-card__badge-dot" aria-hidden="true" />
      {label}
    </span>
  );
}

export function CoasPage({ data }: { data: CoaPageData }) {
  const [activeCategory, setActiveCategory] = useState<CoaCategory>("all");

  const visibleEntries = useMemo(() => {
    if (activeCategory === "all") {
      return data.entries;
    }

    return data.entries.filter((entry) => entry.category === activeCategory);
  }, [activeCategory, data.entries]);

  return (
    <section className="shell page-section coas-page">
      <div className="coas-hero">
        <picture className="coas-hero__media">
          <source media="(max-width: 767px)" srcSet={data.heroMobileImage} />
          <img
            src={data.heroDesktopImage}
            alt="Certificates of analysis hero"
            className="coas-hero__image"
          />
        </picture>

        <div className="coas-hero__content">
          <p className="eyebrow">Certificates of Analysis</p>
          <h1>{data.heroTitle}</h1>
          <p>{data.heroDescription}</p>
        </div>
      </div>

      <div className="coas-page__header">
        <p className="eyebrow">Certificates of Analysis</p>
        <h2>Browse by product type</h2>
      </div>

      <div className="coas-tabs" role="tablist" aria-label="COA product filters">
        {CATEGORY_OPTIONS.map((option) => {
          const isActive = option.value === activeCategory;

          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`coas-tabs__button ${isActive ? "is-active" : ""}`}
              onClick={() => setActiveCategory(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="coas-grid" aria-live="polite">
        {visibleEntries.map((entry) => (
          <article key={`${entry.title}-${entry.reportHref}`} className="coas-card">
            <div className="coas-card__badges">
              <CoaBadge tone="blueprint" label="Blueprint Certified" />
              <CoaBadge tone="tested" label="3rd Party Tested" />
            </div>

            <Link href={entry.href} className="coas-card__image-wrap">
              <img src={entry.image} alt={entry.title} className="coas-card__image" />
            </Link>

            <div className="coas-card__body">
              <Link href={entry.href} className="coas-card__title">
                {entry.title}
              </Link>

              <a
                href={entry.reportHref}
                className="coas-card__report-link"
                target="_blank"
                rel="noreferrer"
              >
                Download Full Report
              </a>

              <p className="coas-card__price">{entry.priceLabel}</p>
            </div>
          </article>
        ))}
      </div>

      <p className="coas-page__footnote">
        *COAs are property of Blueprint and are not to be used without Blueprint&apos;s consent.
      </p>

      {data.faqs.length > 0 ? (
        <section className="coas-faq">
          <div className="coas-page__header coas-page__header--faq">
            <h2>Frequently Asked Questions</h2>
          </div>

          <div className="coas-faq__items">
            {data.faqs.map((faq) => (
              <details key={faq.question} className="coas-faq__item">
                <summary className="coas-faq__question">{faq.question}</summary>
                <div
                  className="coas-faq__answer"
                  dangerouslySetInnerHTML={{ __html: faq.answerHtml }}
                />
              </details>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
