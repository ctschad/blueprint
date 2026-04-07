type Testimonial = {
  title: string;
  quote: string;
};

export function TestimonialCarousel({ items }: { items: Testimonial[] }) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="protocol-quiz-reviews testimonial-reviews-home">
      <div className="protocol-quiz-reviews__header">
        <p className="eyebrow">What People Say</p>
        <h2>Customers already building routines with Blueprint.</h2>
      </div>

      <div className="protocol-quiz-reviews__grid">
        {items.map((item) => (
          <article key={`${item.title}-${item.quote.slice(0, 24)}`} className="protocol-quiz-review">
            <div className="protocol-quiz-review__stars" aria-hidden="true">
              <span>★★★★★</span>
            </div>
            <p className="protocol-quiz-review__quote">“{item.quote}”</p>
            <p className="protocol-quiz-review__name">{item.title}</p>
            <p className="protocol-quiz-review__label">Blueprint Customer</p>
          </article>
        ))}
      </div>
    </section>
  );
}
