"use client";

import Link from "next/link";
import {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type FormEvent,
  type MouseEvent
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { OptimizedImage } from "@/components/optimized-image";

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
};

type SearchArticle = {
  href: string;
  title: string;
  image: string | null;
};

type SearchResponse = {
  articles: SearchArticle[];
  products: SearchProduct[];
};

type SearchExperienceProps = {
  favorites: SearchProduct[];
  initialQuery: string;
  initialResults: SearchResponse;
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

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

export function SearchExperience({ favorites, initialQuery, initialResults }: SearchExperienceProps) {
  const router = useRouter();
  const pathname = usePathname() || "/search";
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState<SearchResponse>(initialResults);
  const [resultsQuery, setResultsQuery] = useState(initialQuery.trim());
  const trimmedQuery = query.trim();

  useEffect(() => {
    setQuery(initialQuery);
    setResults(initialResults);
    setResultsQuery(initialQuery.trim());
  }, [initialQuery, initialResults]);

  useEffect(() => {
    const normalizedQuery = trimmedQuery;

    if (!normalizedQuery) {
      setResults({ articles: [], products: [] });
      setResultsQuery("");
      return;
    }

    if (normalizedQuery === resultsQuery) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(normalizedQuery)}`, {
          signal: controller.signal
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as SearchResponse;
        setResults(payload);
        setResultsQuery(normalizedQuery);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [resultsQuery, trimmedQuery]);

  const showSuggestions = isFocused && Boolean(trimmedQuery);
  const suggestionProducts = useMemo(() => results.products.slice(0, 3), [results.products]);
  const suggestionArticles = useMemo(() => results.articles.slice(0, 3), [results.articles]);

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
    setResults({ articles: [], products: [] });
    setResultsQuery("");
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

  const handleSuggestionMouseDown = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
  };

  return (
    <section className={`shell page-section search-page ${trimmedQuery ? "is-results" : "is-empty"}`}>
      <div className="search-page__hero">
        {trimmedQuery ? <h1 className="search-page__title">Search results</h1> : null}

        <div
          ref={wrapperRef}
          className="search-page__search-wrap"
          onBlurCapture={handleBlur}
          onFocusCapture={() => setIsFocused(true)}
        >
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
                      <Link
                        key={product.handle}
                        href={`/products/${product.handle}`}
                        className="search-suggestion-item"
                        onMouseDown={handleSuggestionMouseDown}
                        onClick={() => setIsFocused(false)}
                      >
                        <div className="search-suggestion-item__image-wrap">
                          {product.image ? (
                            <OptimizedImage
                              src={product.image}
                              alt={product.title}
                              className="search-suggestion-item__image"
                              sizes="5.5rem"
                            />
                          ) : (
                            <div className="search-suggestion-item__image search-suggestion-item__image--empty" />
                          )}
                        </div>
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
                      <Link
                        key={article.href}
                        href={article.href}
                        className="search-suggestion-item search-suggestion-item--article"
                        onMouseDown={handleSuggestionMouseDown}
                        onClick={() => setIsFocused(false)}
                      >
                        <div className="search-suggestion-item__image-wrap">
                          {article.image ? (
                            <OptimizedImage
                              src={article.image}
                              alt={article.title}
                              className="search-suggestion-item__image"
                              sizes="5.5rem"
                            />
                          ) : (
                            <div className="search-suggestion-item__image search-suggestion-item__image--empty" />
                          )}
                        </div>
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
                onMouseDown={handleSuggestionMouseDown}
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
        results.products.length ? (
          <div className="search-results-grid">
            {results.products.map((product) => (
              <article key={product.handle} className="search-result-card">
                <Link href={`/products/${product.handle}`} className="search-result-card__image-wrap">
                  {product.image ? (
                    <OptimizedImage
                      src={product.image}
                      alt={product.title}
                      className="search-result-card__image"
                      sizes="(min-width: 1200px) 18vw, (min-width: 768px) 30vw, 80vw"
                    />
                  ) : null}
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
                <div className="search-favorite-item__image-wrap">
                  {product.image ? (
                    <OptimizedImage
                      src={product.image}
                      alt={product.title}
                      className="search-favorite-item__image"
                      sizes="4.75rem"
                    />
                  ) : null}
                </div>
                <span className="search-favorite-item__title">{product.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
