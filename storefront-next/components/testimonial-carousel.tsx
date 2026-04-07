"use client";

import { useState } from "react";

type Testimonial = {
  title: string;
  quote: string;
};

export function TestimonialCarousel({ items }: { items: Testimonial[] }) {
  const [active, setActive] = useState(0);
  const current = items[active];

  if (!current) {
    return null;
  }

  return (
    <section className="testimonial-carousel">
      <div className="testimonial-carousel__copy">
        <p className="eyebrow">Testimonials</p>
        <h2>{current.title}</h2>
        <p>{current.quote}</p>
      </div>

      <div className="testimonial-carousel__controls">
        <button type="button" onClick={() => setActive((active - 1 + items.length) % items.length)}>
          Previous
        </button>
        <span>
          {active + 1} / {items.length}
        </span>
        <button type="button" onClick={() => setActive((active + 1) % items.length)}>
          Next
        </button>
      </div>
    </section>
  );
}
