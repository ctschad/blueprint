"use client";

import { useState } from "react";

type BiomarkersFaqItem = {
  question: string;
  answer: string;
};

type BiomarkersFaqProps = {
  items: BiomarkersFaqItem[];
};

export function BiomarkersFaq({ items }: BiomarkersFaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="biomarkers-faq-accordion">
      {items.map((faq, index) => {
        const isOpen = index === openIndex;

        return (
          <article key={faq.question} className={`biomarkers-faq-row${isOpen ? " is-open" : ""}`}>
            <button
              type="button"
              className="biomarkers-faq-row__trigger"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
            >
              <span>{faq.question}</span>
              <span className="biomarkers-faq-row__icon" aria-hidden="true">
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen ? (
              <div className="biomarkers-faq-row__answer">
                <p>{faq.answer}</p>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
