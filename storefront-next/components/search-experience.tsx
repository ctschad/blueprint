"use client";

import Link from "next/link";
import { startTransition, useDeferredValue, useEffect, useRef, useState, type FocusEvent, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";

type SearchProduct = {
  handle: string;
  title: string;
  summary: string;
  keywords: string;
  vendor: string;
  priceMin: number;
  rating: number | null;
  reviewsCount: number | null;
  image: string | null;
  searchText: string;
};

type SearchArticle = {
  href: string;
  title: string;
  image: string | null;
  searchText: string;
};

type SearchExperienceProps = {
  initialQuery: string;
  products: SearchProduct[];
  favorites: SearchProduct[];
  articles: SearchArticle[];
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

function tokenize(query: string) {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function scoreField(value: string, tokens: string[], weight: number) {
  if (!value.trim()) {
    return 0;
  }

  let score = 0;
  for (const token of tokens) {
    if (!value.includes(token)) {
      return 0;
    }

    if (value === token) {
      score += 120 * weight;
      continue;
    }

    if (value.startsWith(token)) {
      score += 90 * weight;
      continue;
    }

    if (value.includes(` ${token}`) || value.includes(`-${token}`) || value.includes(`| ${token}`)) {
      score += 60 * weight;
      continue;
    }

    score += 36 * weight;
  }

  return score;
}

function scoreProduct(product: SearchProduct, query: string) {
  const tokens = tokenize(query);
  if (!tokens.length) {
    return 0;
  }

  const title = product.title.toLowerCase();
  const summary = product.summary.toLowerCase();
  const keywords = product.keywords.toLowerCase();
  const vendor = product.vendor.toLowerCase();
  const full = product.searchText;

  const score =
    scoreField(title, tokens, 9) +
    scoreField(keywords, tokens, 6) +
    scoreField(summary, tokens, 4) +
    scoreField(vendor, tokens, 2) +
    scoreField(full, tokens, 1);

  return score + Math.round((product.rating ?? 0) * 2);
}

function scoreArticle(article: SearchArticle, query: string) {
  const tokens = tokenize(query);
  if (!tokens.length) {
    return 0;
  }

  return scoreField(article.title.toLowerCase(), tokens, 7) + scoreField(article.searchText, tokens, 1);
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M16.5 16.5 21 21" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6 18 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
      <path d="M18 6 6 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
    </svg>
  );
}

function renderStars(rating: number | null) {
  if (!rating) {
    return null;
  }

  const filled = Math.max(1, Math.min(5, Math.round(rating)));
  return (
    <span className="search-result-card__stars" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {"★".repeat(filled)}
      <span className="search-result-card__stars-muted">{"★".repeat(5 - filled)}</span>
    </span>
  );
}

export function SearchExperience({
  initialQuery,
  products,
  favorites,
  articles
}: SearchExperienceProps) {
  const router = useRouter();
  const pathname = usePathname() || "/search";
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const trimmedQuery = query.trim();
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const productResults = normalizedQuery
    ? products
        .map((product) => ({
          product,
          score: scoreProduct(product, normalizedQuery)
        }))
        .filter((item) => item.score > 0)
        .sort(
          (left, right) =>
            right.score - left.score ||
            (right.product.rating ?? 0) - (left.product.rating ?? 0) ||
            left.product.title.localeCompare(right.product.title)
        )
        .map((item) => item.product)
    : [];

  const articleResults = normalizedQuery
    ? articles
        .map((article) => ({
          article,
          score: scoreArticle(article, normalizedQuery)
        }))
        .filter((item) => item.score > 0)
        .sort((left, right) => right.score - left.score || left.article.title.localeCompare(right.article.title))
        .map((item) => item.article)
    : [];

  const showSuggestions = isFocused && Boolean(trimmedQuery);
  const suggestionProducts = productResults.slice(0, 3);
  const suggestionArticles = articleResults.slice(0, 3);

  const commitSearch = (nextQuery: string) => {
    const normalized = nextQuery.trim();
    startTransition(() => {
      router.replace(normalized ? `${pathname}?q=${encodeURIComponent(normalized)}` : pathname, {
        scroll: false
      });
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    commitSearch(query);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setQuery("");
    setIsFocused(false);
    commitSearch("");
    inputRef.current?.focus();
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && wrapperRef.current?.contains(nextTarget)) {
      return;
    }
    setIsFocused(false);
  };

  return (
    <section className={`shell page-section search-page ${trimmedQuery ? "is-results" : "is-empty"}`}>
      <div className="search-page__hero">
        {trimmedQuery ? <h1 className="search-page__title">Search results</h1> : null}

        <div ref={wrapperRef} className="search-page__search-wrap" onBlurCapture={handleBlur} onFocusCapture={() => setIsFocused(true)}>
          <form action="/search" className="search-box" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              name="q"
              value={query}
              autoFocus
              autoComplete="off"
              placeholder="Search products or protocols"
              className="search-box__input"
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className="search-box__actions">
              <button
                type="button"
                className={`search-box__clear ${trimmedQuery ? "is-active" : ""}`}
                onClick={handleClear}
                aria-label="Clear search"
              >
                <CloseIcon />
              </button>
              <button type="submit" className="search-box__submit" aria-label="Search">
                <SearchIcon />
              </button>
            </div>
          </form>

          {showSuggestions ? (
            <div className="search-suggestions">
              <div className="search-suggestions__body">
                <div className="search-suggestions__section">
                  <p className="search-suggestions__label">Products</p>
                  {suggestionProducts.length ? (
                    suggestionProducts.map((product) => (
                      <Link key={product.handle} href={`/products/${product.handle}`} className="search-suggestion-item">
                        {product.image ? (
                          <img src={product.image} alt={product.title} className="search-suggestion-item__image" />
                        ) : (
                          <div className="search-suggestion-item__image search-suggestion-item__image--empty" />
                        )}
                        <div className="search-suggestion-item__copy">
                          <p className="search-suggestion-item__eyebrow">{product.vendor}</p>
                          <p className="search-suggestion-item__title">{product.title}</p>
                          <p className="search-suggestion-item__price">{moneyFormatter.format(product.priceMin / 100)}</p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="search-suggestions__empty">No product matches yet.</p>
                  )}
                </div>

                <div className="search-suggestions__section">
                  <p className="search-suggestions__label">Articles</p>
                  {suggestionArticles.length ? (
                    suggestionArticles.map((article) => (
                      <Link key={article.href} href={article.href} className="search-suggestion-item search-suggestion-item--article">
                        {article.image ? (
                          <img src={article.image} alt={article.title} className="search-suggestion-item__image" />
                        ) : (
                          <div className="search-suggestion-item__image search-suggestion-item__image--empty" />
                        )}
                        <div className="search-suggestion-item__copy">
                          <p className="search-suggestion-item__title">{article.title}</p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="search-suggestions__empty">No article matches yet.</p>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="search-suggestions__view-all"
                onClick={() => {
                  commitSearch(query);
                  setIsFocused(false);
                  inputRef.current?.blur();
                }}
              >
                View all
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {trimmedQuery ? (
        productResults.length ? (
          <div className="search-results-grid">
            {productResults.map((product) => (
              <article key={product.handle} className="search-result-card">
                <Link href={`/products/${product.handle}`} className="search-result-card__image-wrap">
                  {product.image ? <img src={product.image} alt={product.title} className="search-result-card__image" /> : null}
                </Link>
                <Link href={`/products/${product.handle}`} className="search-result-card__title">
                  {product.title}
                </Link>
                <div className="search-result-card__meta">
                  {renderStars(product.rating)}
                  {product.reviewsCount ? (
                    <span className="search-result-card__reviews">({product.reviewsCount})</span>
                  ) : null}
                </div>
                <p className="search-result-card__price">{moneyFormatter.format(product.priceMin / 100)}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="search-empty">
            <h2>No matching products yet.</h2>
            <p>Try a different ingredient, protocol, or benefit.</p>
          </div>
        )
      ) : (
        <div className="search-favorites">
          <p className="search-favorites__title">Bryan&apos;s Favorites</p>
          <div className="search-favorites__list">
            {favorites.map((product) => (
              <Link key={product.handle} href={`/products/${product.handle}`} className="search-favorite-item">
                {product.image ? <img src={product.image} alt={product.title} className="search-favorite-item__image" /> : null}
                <span className="search-favorite-item__title">{product.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
