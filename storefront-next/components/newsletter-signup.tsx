"use client";

import { FormEvent, useState } from "react";
import { OptimizedImage } from "@/components/optimized-image";

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

function isValidEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function NewsletterSignup({ content }: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setStatus("error");
      setErrorMessage("Enter an email address to join the newsletter.");
      return;
    }

    if (!isValidEmailAddress(trimmedEmail)) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setStatus("success");
    setErrorMessage("");
    setEmail("");
  }

  function handleChange(value: string) {
    setEmail(value);

    if (status === "success") {
      setStatus("idle");
    }

    if (status === "error") {
      if (!value.trim()) {
        setErrorMessage("");
        return;
      }

      if (isValidEmailAddress(value.trim())) {
        setStatus("idle");
        setErrorMessage("");
      }
    }
  }

  function handleBlur() {
    if (!email.trim()) {
      return;
    }

    if (!isValidEmailAddress(email.trim())) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address.");
    }
  }

  return (
    <section className="shell page-section newsletter-signup">
      <div className="newsletter-signup__grid">
        <div className="newsletter-signup__image-wrap">
          <OptimizedImage
            src={content.image.src}
            alt={content.image.alt}
            className="newsletter-signup__image"
            sizes="(min-width: 1200px) 40vw, 100vw"
          />
        </div>

        <div className="newsletter-signup__content">
          <p className="eyebrow newsletter-signup__eyebrow">{content.eyebrow}</p>
          <h2>{content.heading}</h2>
          <p className="newsletter-signup__description">{content.description}</p>

          <form
            className={`newsletter-signup__form ${status === "error" ? "newsletter-signup__form--error" : ""}`}
            onSubmit={handleSubmit}
            noValidate
          >
            <input
              type="email"
              name="email"
              value={email}
              onChange={(event) => handleChange(event.target.value)}
              onBlur={handleBlur}
              placeholder={content.placeholder}
              aria-label={content.placeholder}
              aria-invalid={status === "error"}
              className="newsletter-signup__input"
              autoComplete="email"
              inputMode="email"
            />
            <button type="submit" className="newsletter-signup__submit" aria-label="Submit email">
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <p
            className={`newsletter-signup__message ${
              status === "error" ? "newsletter-signup__message--error" : ""
            }`}
            role="status"
            aria-live="polite"
          >
            {status === "success"
              ? "Thanks. You’re on the list."
              : status === "error"
                ? errorMessage
                : "\u00A0"}
          </p>
        </div>
      </div>
    </section>
  );
}
