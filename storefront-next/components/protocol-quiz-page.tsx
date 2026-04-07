"use client";

import Link from "next/link";
import { useState } from "react";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { formatMoney } from "@/lib/storefront";
import type { Product } from "@/lib/types";

type QuizAnswer =
  | "simple"
  | "balanced"
  | "complete"
  | "foundation"
  | "performance"
  | "longevity"
  | "under-1"
  | "two-minutes"
  | "deep-routine"
  | "drink"
  | "capsules"
  | "full-breakfast";

type ResultKey = "easy" | "medium" | "big";

type QuizQuestion = {
  id: string;
  prompt: string;
  helper: string;
  options: Array<{
    id: QuizAnswer;
    label: string;
    description: string;
  }>;
};

type ResultDefinition = {
  title: string;
  subtitle: string;
  description: string;
  handle: string;
  supportHandles: string[];
};

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "pace",
    prompt: "How do you want your protocol to feel?",
    helper: "Choose the level of simplicity that fits your life right now.",
    options: [
      {
        id: "simple",
        label: "Simple and fast",
        description: "I want the easiest strong starting point."
      },
      {
        id: "balanced",
        label: "Balanced and steady",
        description: "I can commit to a couple of minutes each morning."
      },
      {
        id: "complete",
        label: "Comprehensive",
        description: "I want the fullest Blueprint-style routine."
      }
    ]
  },
  {
    id: "goal",
    prompt: "What are you optimizing for first?",
    helper: "This helps shape the emphasis of your protocol.",
    options: [
      {
        id: "foundation",
        label: "Daily foundation",
        description: "Energy, immunity, and an easier baseline."
      },
      {
        id: "performance",
        label: "Strength and performance",
        description: "I want more support for training, recovery, and output."
      },
      {
        id: "longevity",
        label: "Deep longevity support",
        description: "I want the broadest protocol I can realistically keep."
      }
    ]
  },
  {
    id: "time",
    prompt: "How much time can you give your morning routine?",
    helper: "We’ll match your result to the ritual you’ll actually keep doing.",
    options: [
      {
        id: "under-1",
        label: "Under a minute",
        description: "Fast and frictionless is the priority."
      },
      {
        id: "two-minutes",
        label: "A couple minutes",
        description: "I want a stronger routine without much complexity."
      },
      {
        id: "deep-routine",
        label: "A fuller ritual",
        description: "I’m open to a more complete protocol."
      }
    ]
  },
  {
    id: "format",
    prompt: "Which format sounds most natural?",
    helper: "Pick the mix of drinks, capsules, and daily ritual that feels intuitive.",
    options: [
      {
        id: "drink",
        label: "Drink + capsules",
        description: "I want something clean, efficient, and easy to repeat."
      },
      {
        id: "capsules",
        label: "Mostly capsules",
        description: "I want strong support with minimal prep."
      },
      {
        id: "full-breakfast",
        label: "A fuller breakfast protocol",
        description: "I want the widest Blueprint-style coverage."
      }
    ]
  }
];

const RESULT_DEFINITIONS: Record<ResultKey, ResultDefinition> = {
  easy: {
    title: "Easy Stack",
    subtitle: "Your personalized protocol starts here.",
    description:
      "A low-friction routine built to support energy, immunity, and daily longevity without overwhelming your mornings.",
    handle: "easy-stack",
    supportHandles: [
      "longevity-blend-multinutrient-drink-mix-blood-orange-flavor",
      "essentials-capsules"
    ]
  },
  medium: {
    title: "Medium Stack",
    subtitle: "A stronger routine with just enough depth.",
    description:
      "This protocol expands your daily foundation with broader support for performance, resilience, and long-term consistency.",
    handle: "medium-stack",
    supportHandles: [
      "longevity-blend-multinutrient-drink-mix-blood-orange-flavor",
      "essentials-capsules",
      "advanced-antioxidants"
    ]
  },
  big: {
    title: "Big Stack",
    subtitle: "Your most comprehensive longevity protocol.",
    description:
      "This is the highest-coverage option for a deeper Blueprint-style routine, with breakfast and post-workout support in one system.",
    handle: "big-stack",
    supportHandles: [
      "longevity-blend-multinutrient-drink-mix-blood-orange-flavor",
      "essentials-capsules",
      "advanced-antioxidants",
      "extra-virgin-olive-oil"
    ]
  }
};

const REVIEW_QUOTES = [
  {
    quote:
      "Bryan Johnson's Blueprint products have exceeded my expectations. The quality is unmatched. The attention to detail in flavor, freshness, and packaging shows a true commitment to excellence.",
    name: "Daniel K"
  },
  {
    quote:
      "I've been using Blueprint for 3 months now and the results speak for themselves. My energy levels are through the roof and recovery time has improved dramatically.",
    name: "Sarah M"
  },
  {
    quote:
      "The personalized protocol from the quiz was spot on. Each product serves a purpose and I can feel the difference. Customer for life!",
    name: "Marcus T"
  }
] as const;

function getPrimaryVariant(product: Product) {
  return product.variants.find((variant) => variant.available) ?? product.variants[0];
}

function quizResultFromAnswers(answers: Partial<Record<string, QuizAnswer>>): ResultKey {
  const scores: Record<ResultKey, number> = { easy: 0, medium: 0, big: 0 };

  for (const answer of Object.values(answers)) {
    switch (answer) {
      case "simple":
      case "foundation":
      case "under-1":
      case "drink":
        scores.easy += 2;
        break;
      case "balanced":
      case "performance":
      case "two-minutes":
      case "capsules":
        scores.medium += 2;
        break;
      case "complete":
      case "longevity":
      case "deep-routine":
      case "full-breakfast":
        scores.big += 2;
        break;
      default:
        break;
    }
  }

  if (scores.big >= scores.medium && scores.big >= scores.easy) {
    return "big";
  }

  if (scores.medium >= scores.easy) {
    return "medium";
  }

  return "easy";
}

export function ProtocolQuizPage({ products }: { products: Product[] }) {
  const [hasStarted, setHasStarted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<string, QuizAnswer>>>({});

  const productMap = new Map(products.map((product) => [product.handle, product]));
  const activeQuestion = QUIZ_QUESTIONS[stepIndex];
  const isComplete = QUIZ_QUESTIONS.every((question) => answers[question.id]);
  const resultKey = isComplete ? quizResultFromAnswers(answers) : null;
  const result = resultKey ? RESULT_DEFINITIONS[resultKey] : null;
  const recommendedStack = result ? productMap.get(result.handle) : null;
  const heroCardClassName = [
    "protocol-quiz-hero__card",
    !hasStarted
      ? "protocol-quiz-hero__card--intro"
      : result && recommendedStack
        ? "protocol-quiz-hero__card--result"
        : "protocol-quiz-hero__card--question"
  ].join(" ");
  const supportingProducts = result
    ? result.supportHandles
        .map((handle) => productMap.get(handle))
        .filter((product): product is Product => Boolean(product))
    : products.filter((product) => ["easy-stack", "medium-stack", "big-stack"].includes(product.handle));

  function handleSelect(optionId: QuizAnswer) {
    setAnswers((current) => ({
      ...current,
      [activeQuestion.id]: optionId
    }));

    if (stepIndex < QUIZ_QUESTIONS.length - 1) {
      setStepIndex((current) => current + 1);
    }
  }

  function handleRestart() {
    setHasStarted(false);
    setStepIndex(0);
    setAnswers({});
  }

  return (
    <section className="protocol-quiz-page">
      <div className="shell page-section">
        <div className="protocol-quiz-hero">
          <picture className="protocol-quiz-hero__media">
            <source media="(max-width: 767px)" srcSet="/cdn/shop/files/quizupdatemobile__q_4b41db636fa8.png" />
            <img
              src="/cdn/shop/files/quiz-desktop__q_f5324434dd71.png"
              alt="Collection of Blueprint products on a concrete surface"
              className="protocol-quiz-hero__image"
            />
          </picture>

          <div className={heroCardClassName}>
            {!hasStarted ? (
              <>
                <p className="protocol-quiz-hero__eyebrow">Protocol Quiz</p>
                <h1>Get your personalized longevity protocol</h1>
                <p>
                  Save 5% when you subscribe to your protocol. We&apos;ll match you to the
                  Blueprint routine that fits your goals, mornings, and appetite for depth.
                </p>
                <div className="protocol-quiz-hero__actions">
                  <button type="button" className="button button--solid" onClick={() => setHasStarted(true)}>
                    Start Quiz
                  </button>
                  <Link href="/pages/build-my-stack" className="button button--ghost">
                    Build My Stack Instead
                  </Link>
                </div>
              </>
            ) : result && recommendedStack ? (
              <>
                <p className="protocol-quiz-hero__eyebrow">The results are in</p>
                <h1>{result.title}</h1>
                <p className="protocol-quiz-hero__result-subtitle">{result.subtitle}</p>
                <p>{result.description}</p>

                <div className="protocol-quiz-hero__result-card">
                  <img
                    src={recommendedStack.images[0]?.src}
                    alt={recommendedStack.images[0]?.alt ?? recommendedStack.title}
                    className="protocol-quiz-hero__result-image"
                  />
                  <div className="protocol-quiz-hero__result-copy">
                    <p className="protocol-quiz-hero__result-label">Recommended protocol</p>
                    <h2>{recommendedStack.title}</h2>
                    <p>{recommendedStack.keywords.replace(/\s*\|\s*/g, " • ")}</p>
                    <div className="protocol-quiz-hero__result-actions">
                      {getPrimaryVariant(recommendedStack) ? (
                        <AddToCartButton
                          className="button button--solid"
                          productHandle={recommendedStack.handle}
                          productTitle={recommendedStack.title}
                          variantId={getPrimaryVariant(recommendedStack)!.id}
                          variantTitle={
                            getPrimaryVariant(recommendedStack)!.publicTitle ||
                            getPrimaryVariant(recommendedStack)!.title
                          }
                          price={getPrimaryVariant(recommendedStack)!.price}
                          image={recommendedStack.images[0]?.src}
                        />
                      ) : null}
                      <Link href={`/products/${recommendedStack.handle}`} className="button button--ghost">
                        View Details
                      </Link>
                    </div>
                    <p className="protocol-quiz-hero__price">
                      {formatMoney(recommendedStack.priceMin)}
                    </p>
                  </div>
                </div>

                <div className="protocol-quiz-hero__actions">
                  <button type="button" className="button button--ghost" onClick={handleRestart}>
                    Retake Quiz
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="protocol-quiz-progress">
                  <span className="protocol-quiz-progress__label">
                    Question {stepIndex + 1} of {QUIZ_QUESTIONS.length}
                  </span>
                  <div className="protocol-quiz-progress__bar" aria-hidden="true">
                    <span style={{ width: `${((stepIndex + 1) / QUIZ_QUESTIONS.length) * 100}%` }} />
                  </div>
                </div>

                <div className="protocol-quiz-question">
                  <p className="protocol-quiz-hero__eyebrow">Personalize your protocol</p>
                  <h1>{activeQuestion.prompt}</h1>
                  <p>{activeQuestion.helper}</p>

                  <div className="protocol-quiz-options">
                    {activeQuestion.options.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className="protocol-quiz-option"
                        onClick={() => handleSelect(option.id)}
                      >
                        <span className="protocol-quiz-option__title">{option.label}</span>
                        <span className="protocol-quiz-option__description">{option.description}</span>
                      </button>
                    ))}
                  </div>

                  <div className="protocol-quiz-question__footer">
                    <button
                      type="button"
                      className="button button--ghost"
                      onClick={() => {
                        if (stepIndex === 0) {
                          setHasStarted(false);
                          return;
                        }
                        setStepIndex((current) => current - 1);
                      }}
                    >
                      Back
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="shell page-section protocol-quiz-support">
        <div className="protocol-quiz-support__header">
          <p className="eyebrow">Blueprint Favorites</p>
          <h2>What a custom protocol is built around.</h2>
          <p className="section-copy section-copy--narrow">
            These are the products most often used together when building a daily routine.
          </p>
        </div>

        <div className="protocol-quiz-support__grid">
          {supportingProducts.map((product) => {
            const variant = getPrimaryVariant(product);
            return (
              <article key={product.handle} className="protocol-quiz-card">
                <Link href={`/products/${product.handle}`} className="protocol-quiz-card__image-wrap">
                  <img
                    src={product.images[0]?.src}
                    alt={product.images[0]?.alt ?? product.title}
                    className="protocol-quiz-card__image"
                  />
                </Link>
                <div className="protocol-quiz-card__body">
                  <Link href={`/products/${product.handle}`} className="protocol-quiz-card__title">
                    {product.title}
                  </Link>
                  <p className="protocol-quiz-card__keywords">
                    {product.keywords.replace(/\s*\|\s*/g, " • ")}
                  </p>
                  <p className="protocol-quiz-card__price">{formatMoney(product.priceMin)}</p>
                  {variant ? (
                    <AddToCartButton
                      className="button button--solid button--full"
                      productHandle={product.handle}
                      productTitle={product.title}
                      variantId={variant.id}
                      variantTitle={variant.publicTitle || variant.title}
                      price={variant.price}
                      image={product.images[0]?.src}
                    />
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="shell page-section protocol-quiz-reviews">
        <div className="protocol-quiz-reviews__header">
          <p className="eyebrow">What People Say</p>
          <h2>Customers already using their custom protocols.</h2>
        </div>

        <div className="protocol-quiz-reviews__grid">
          {REVIEW_QUOTES.map((review) => (
            <article key={review.name} className="protocol-quiz-review">
              <div className="protocol-quiz-review__stars" aria-hidden="true">
                <span>★★★★★</span>
              </div>
              <p className="protocol-quiz-review__quote">“{review.quote}”</p>
              <p className="protocol-quiz-review__name">{review.name}</p>
              <p className="protocol-quiz-review__label">Verified Buyer</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
