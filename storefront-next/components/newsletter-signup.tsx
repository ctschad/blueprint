"use client";

import { FormEvent, useState } from "react";

type NewsletterContent = {
  eyebrow: string;
  heading: string;
  description: string;
  placeholder: string;
  image: {
    src: string;
    alt: string;
  };
};

type NewsletterSignupProps = {
  content: NewsletterContent;
};

export function NewsletterSignup({ content }: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) {
      return;
    }
    setSubmitted(true);
    setEmail("");
  }

  return (
    <section className="shell page-section newsletter-signup">
      <div className="newsletter-signup__grid">
        <div className="newsletter-signup__image-wrap">
          <img
            src={content.image.src}
            alt={content.image.alt}
            className="newsletter-signup__image"
          />
        </div>

        <div className="newsletter-signup__content">
          <p className="eyebrow newsletter-signup__eyebrow">{content.eyebrow}</p>
          <h2>{content.heading}</h2>
          <p className="newsletter-signup__description">{content.description}</p>

          <form className="newsletter-signup__form" onSubmit={handleSubmit}>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={content.placeholder}
              aria-label={content.placeholder}
              className="newsletter-signup__input"
              required
            />
            <button type="submit" className="newsletter-signup__submit" aria-label="Submit email">
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <p className="newsletter-signup__message" role="status" aria-live="polite">
            {submitted ? "Thanks. You’re on the list." : "\u00A0"}
          </p>
        </div>
      </div>
    </section>
  );
}
