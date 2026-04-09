"use client";

import { useState } from "react";

type HealthImpactItem = {
  title: string;
  description: string;
  markers: string[];
  icon: string;
  badge?: string;
};

type BiomarkersHealthImpactsProps = {
  title: string;
  subtitle: string;
  image: string;
  items: HealthImpactItem[];
  ctaHref: string;
};

export function BiomarkersHealthImpacts({
  title,
  subtitle,
  image,
  items,
  ctaHref
}: BiomarkersHealthImpactsProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="biomarkers-health-impacts">
      <div className="biomarkers-health-impacts__visual">
        <img src={image} alt="" className="biomarkers-health-impacts__image" />
        <div className="biomarkers-health-impacts__overlay">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="biomarkers-health-impacts__content">
        <div className="biomarkers-health-impacts__items">
          {items.map((item, index) => {
            const isOpen = index === activeIndex;

            return (
              <article
                key={item.title}
                className={`biomarkers-health-impacts__item${isOpen ? " is-open" : ""}`}
              >
                <button
                  type="button"
                  className="biomarkers-health-impacts__trigger"
                  onClick={() => setActiveIndex(isOpen ? -1 : index)}
                  aria-expanded={isOpen}
                >
                  <span className="biomarkers-health-impacts__trigger-main">
                    <img
                      src={item.icon}
                      alt=""
                      aria-hidden="true"
                      className="biomarkers-health-impacts__icon"
                    />
                    <span className="biomarkers-health-impacts__trigger-title">{item.title}</span>
                    {item.badge ? (
                      <span className="biomarkers-health-impacts__badge">{item.badge}</span>
                    ) : null}
                  </span>
                  <span className="biomarkers-health-impacts__toggle" aria-hidden="true">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                {isOpen ? (
                  <div className="biomarkers-health-impacts__panel">
                    <p>{item.description}</p>
                    <div className="biomarkers-health-impacts__chips">
                      {item.markers.map((marker) => (
                        <span key={marker} className="biomarkers-health-impacts__chip">
                          {marker}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        <a
          href={ctaHref}
          className="biomarkers-button biomarkers-button--primary biomarkers-health-impacts__cta"
          target="_blank"
          rel="noreferrer"
        >
          Start now — $1 / day*
        </a>
      </div>
    </div>
  );
}
