import Link from "next/link";

const START_URL = "https://biomarkers.bryanjohnson.com/";

const HERO_BULLETS = [
  "160+ measurements for 100+ biomarkers",
  "Securely store data, including past labs",
  "Get personalized longevity insights"
];

const VALUE_PROPS = [
  {
    title: "Largest number of measurements",
    description: "Go deeper than standard lab panels with a broader baseline across the systems that shape longevity.",
    icon: "/cdn/shop/files/biomarkers-icon-largest-number-tests__q_021735784915.png"
  },
  {
    title: "Lowest price per test",
    description: "Access two comprehensive testing windows each year at less than 1% of the cost of building it yourself.",
    icon: "/cdn/shop/files/biomarkers-icon-lowest-test-price__q_021735784915.png"
  },
  {
    title: "Protocol by Bryan Johnson",
    description: "Use the same measurement framework that powers Bryan Johnson's testing, adapted to your own data.",
    icon: "/cdn/shop/files/biomarkers-icon-protocol-by-bryan-johnson__q_021735784915.png"
  }
];

const BENEFIT_AREAS = [
  {
    title: "Master your mood",
    description: "Balance emotions under stress and conflict with clearer signal on the nutrients and hormones shaping how you feel.",
    markers: "Cortisol • Vitamin D • Omega-3 • Magnesium",
    icon: "/cdn/shop/files/biomarkers-icon-master-your-mood__q_99165d4ee4e7.png"
  },
  {
    title: "Sharpen your mind",
    description: "Support cognition, mental clarity, and memory with a more complete view of what your brain needs to perform.",
    markers: "Omega-3 • Vitamin D • Homocysteine",
    icon: "/cdn/shop/files/biomarkers-icon-sharpen-your-mind__q_6a7f8a117a88.png"
  },
  {
    title: "Feel energized",
    description: "Trace fatigue back to real markers so your protocol can support energy, recovery, and day-to-day output.",
    markers: "Ferritin • Thyroid • B vitamins",
    icon: "/cdn/shop/files/biomarkers-icon-feel-energized__q_99165d4ee4e7.png"
  },
  {
    title: "Catch disease-risk early",
    description: "Flag patterns sooner and build a plan around them before they become harder, costlier problems to solve.",
    markers: "A1C • ApoB • Inflammation • Liver",
    icon: "/cdn/shop/files/biomarkers-icon-catch-disease-early__q_6a7f8a117a88.png"
  },
  {
    title: "Prolong your healthy years",
    description: "Turn repeat testing into a long-range practice that supports a healthier trajectory, not just a single reading.",
    markers: "Lipids • Glucose • Kidney • Longevity",
    icon: "/cdn/shop/files/biomarkers-icon-prolong-healthy-years__q_6a7f8a117a88.png"
  }
];

const HOW_IT_WORKS_STEPS = [
  {
    step: "Step 1",
    title: "Baseline testing",
    description: "Start with a urine and blood test that captures 100+ biomarkers and 160+ measurements.",
    image: "/cdn/shop/files/Mobile_1_2_1.png"
  },
  {
    step: "Step 2",
    title: "Import past labs",
    description: "Bring your old results into one secure home so your current numbers have more context.",
    image: "/media/biomarkers/step2-final-test.png"
  },
  {
    step: "Step 3",
    title: "Build your algorithm",
    description: "Use AI health guidance and the Blueprint framework to turn results into a focused action plan.",
    image: "/cdn/shop/files/Biomarkers_Snapshot_2__q_da23e14c4e4f.png"
  },
  {
    step: "Step 4",
    title: "Retest",
    description: "Measure progress again after six months so your protocol can evolve with the data.",
    image: "/media/biomarkers/step4-final-test-2.png"
  }
];

const RESULT_METRICS = [
  "Muscle: 98th percentile (all men)",
  "Fat: 98th percentile optimal (all men)",
  "Bone mineral density: 99th percentile",
  "Resting heart rate: elite athlete level",
  "Blood pressure: lower than 90% of 18-year-olds",
  "Epigenetic speed of aging: 0.48"
];

const MEMBERSHIP_FEATURES = [
  "160+ measurements per year",
  "Testing 2x per year",
  "AI health companion",
  "Import past labs",
  "100+ biomarkers measured",
  "Bryan Johnson's longevity protocols"
];

const FAQS = [
  {
    question: "What's included in a Biomarkers subscription?",
    answer:
      "The subscription includes two comprehensive blood panels and urine tests per year, covering 100+ unique biomarkers and 160+ measurements, plus access to the Biomarkers platform. Inside the platform, you can visualize results, upload past lab work, use the AI health companion, and get reminders when it's time for your next test."
  },
  {
    question: "How much do I save by ordering tests through Biomarkers?",
    answer:
      "A Biomarkers membership costs $365 per year and gives you access to the same broader testing structure Bryan Johnson uses. Ordering comparable tests individually through a clinical lab can cost thousands of dollars, so the membership is designed to make repeat measurement dramatically more accessible."
  },
  {
    question: "How quickly will I get my results?",
    answer:
      "Most customers receive their results within about a week. Once they arrive, the platform organizes the data, highlights the most important shifts, and helps translate the numbers into next steps."
  },
  {
    question: "Is Biomarkers HSA/FSA eligible?",
    answer:
      "Yes. Biomarkers is HSA/FSA eligible, so you can use pre-tax health dollars to cover the membership where applicable."
  }
];

export function BiomarkersPage() {
  return (
    <div className="biomarkers-page">
      <section className="shell page-section biomarkers-hero-section">
        <div className="biomarkers-hero">
          <div className="biomarkers-hero__copy">
            <p className="eyebrow biomarkers-hero__eyebrow">HSA/FSA Eligible</p>
            <h1>Test your biomarkers like Bryan Johnson</h1>
            <p className="biomarkers-hero__intro">
              One secure platform to test, interpret, and improve the signals shaping how you age.
            </p>

            <ul className="biomarkers-hero__bullets">
              {HERO_BULLETS.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>

            <div className="biomarkers-hero__actions">
              <a
                href={START_URL}
                className="biomarkers-button biomarkers-button--primary"
                target="_blank"
                rel="noreferrer"
              >
                Start now - $1 / day*
              </a>
              <a href="#how-it-works" className="biomarkers-button biomarkers-button--secondary">
                How it works
              </a>
            </div>

            <p className="biomarkers-hero__footnote">*Billed annually</p>
          </div>

          <div className="biomarkers-hero__media">
            <img
              src="/cdn/shop/files/Hero_Image_Thyroid_only.webp"
              alt="Blueprint Biomarkers hero"
              className="biomarkers-hero__image"
            />
          </div>
        </div>
      </section>

      <section className="shell page-section biomarkers-platform">
        <div className="biomarkers-section-heading">
          <p className="eyebrow">Clinically-backed ingredients</p>
          <h2>Build your personal health protocol</h2>
          <p>
            One secure platform to test and optimize your health. The same scientific framework as
            Bryan Johnson, adapted to your own data.
          </p>
        </div>

        <div className="biomarkers-platform__layout">
          <div className="biomarkers-platform__snapshot">
            <img
              src="/cdn/shop/files/SALES_MODULE_3_3.png"
              alt="Biomarkers dashboard on a laptop"
              className="biomarkers-platform__snapshot-image"
            />
          </div>

          <div className="biomarkers-platform__cards">
            {VALUE_PROPS.map((item) => (
              <article key={item.title} className="biomarkers-value-card">
                <img src={item.icon} alt="" aria-hidden="true" className="biomarkers-value-card__icon" />
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="shell page-section biomarkers-benefits">
        <div className="biomarkers-section-heading biomarkers-section-heading--compact">
          <p className="eyebrow">What a better readout unlocks</p>
          <h2>Use your biomarkers to shape how you feel now and how you age next</h2>
        </div>

        <div className="biomarkers-benefits__grid">
          {BENEFIT_AREAS.map((benefit) => (
            <article key={benefit.title} className="biomarkers-benefit-card">
              <div className="biomarkers-benefit-card__icon-wrap">
                <img src={benefit.icon} alt="" aria-hidden="true" className="biomarkers-benefit-card__icon" />
              </div>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
              <span className="biomarkers-benefit-card__markers">{benefit.markers}</span>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="shell page-section biomarkers-process">
        <div className="biomarkers-section-heading">
          <p className="eyebrow">How it works</p>
          <h2>Repeatable measurement, not one-off guesswork</h2>
          <p>
            Biomarkers is designed to make testing feel like a durable part of your routine, from
            baseline collection through retesting.
          </p>
        </div>

        <div className="biomarkers-process__grid">
          {HOW_IT_WORKS_STEPS.map((step) => (
            <article key={step.step} className="biomarkers-process-card">
              <div className="biomarkers-process-card__media">
                <img src={step.image} alt={step.title} className="biomarkers-process-card__image" />
              </div>
              <div className="biomarkers-process-card__body">
                <span className="biomarkers-process-card__step">{step.step}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="shell page-section biomarkers-proof">
        <div className="biomarkers-proof__panel">
          <div className="biomarkers-proof__copy">
            <p className="eyebrow">Bryan Johnson</p>
            <h2>The most measured human in history</h2>
            <p>
              After years of testing and millions spent building the Blueprint protocol, Biomarkers
              turns that same measurement philosophy into a more accessible system for everyone.
            </p>

            <div className="biomarkers-proof__metrics">
              {RESULT_METRICS.map((metric) => (
                <div key={metric} className="biomarkers-proof__metric">
                  {metric}
                </div>
              ))}
            </div>
          </div>

          <div className="biomarkers-proof__media">
            <img
              src="/cdn/shop/files/Blueprint_Bryan_Johnson.webp"
              alt="Bryan Johnson"
              className="biomarkers-proof__image"
            />
          </div>
        </div>
      </section>

      <section id="pricing" className="shell page-section biomarkers-membership">
        <div className="biomarkers-membership__panel">
          <div className="biomarkers-membership__content">
            <p className="eyebrow">Biomarkers Membership</p>
            <h2>The most comprehensive testing at the lowest price per test</h2>
            <p>
              After five years and millions of dollars spent building Bryan Johnson&apos;s longevity
              protocols, Biomarkers makes measurement accessible at less than 1% of the cost.
            </p>

            <div className="biomarkers-price-card">
              <div className="biomarkers-price-card__price">
                $365 <span>per year</span>
              </div>
              <p className="biomarkers-price-card__subcopy">
                $1 per day • HSA/FSA eligible • Results in about a week
              </p>

              <ul className="biomarkers-price-card__features">
                {MEMBERSHIP_FEATURES.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              <div className="biomarkers-price-card__actions">
                <a
                  href={START_URL}
                  className="biomarkers-button biomarkers-button--primary"
                  target="_blank"
                  rel="noreferrer"
                >
                  Start now - $1 / day*
                </a>
                <Link href="/pages/coas" className="biomarkers-button biomarkers-button--secondary">
                  View our test results
                </Link>
              </div>
            </div>
          </div>

          <div className="biomarkers-membership__media">
            <img
              src="/cdn/shop/files/SALES_MODULE_4.png"
              alt="Biomarkers membership visual"
              className="biomarkers-membership__image"
            />
          </div>
        </div>
      </section>

      <section id="faqs" className="shell page-section biomarkers-faq">
        <div className="biomarkers-section-heading biomarkers-faq__header">
          <p className="eyebrow">FAQs</p>
          <h2>Getting started</h2>
        </div>

        <div className="biomarkers-faq__items">
          {FAQS.map((faq) => (
            <article key={faq.question} className="biomarkers-faq__item">
              <h3 className="biomarkers-faq__question">{faq.question}</h3>
              <div className="biomarkers-faq__answer">
                <p>{faq.answer}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
