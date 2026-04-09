import Link from "next/link";
import { BiomarkersHealthImpacts } from "./biomarkers-health-impacts";
import { BiomarkersFaq } from "./biomarkers-faq";

const START_URL = "https://biomarkers.bryanjohnson.com/";

const HERO_BULLETS = [
  "160+ measurements for 100+ biomarkers",
  "Securely store data, including past labs",
  "Get personalized longevity insights"
];

const BENEFIT_AREAS = [
  {
    title: "Master your mood",
    description: "Balance emotions under stress + conflict.",
    markers: ["Cortisol", "Vitamin D", "Omega-3", "Omega-6", "Homocysteine", "Magnesium", "Zinc", "Ferritin", "Thyroid Function"],
    icon: "/cdn/shop/files/biomarkers-icon-master-your-mood__q_99165d4ee4e7.png"
  },
  {
    title: "Sharpen your mind",
    description: "Support cognitive performance + clear thinking + memory.",
    markers: [
      "Vitamin D",
      "Omega-3",
      "Homocysteine",
      "Methylmalonic Acid",
      "Ferritin",
      "Hemoglobin",
      "Hematocrit",
      "Thyroid Function",
      "Heavy Metals",
      "HSCRP",
      "HBA1C",
      "Insulin",
      "Magnesium"
    ],
    icon: "/cdn/shop/files/biomarkers-icon-sharpen-your-mind__q_6a7f8a117a88.png"
  },
  {
    title: "Feel energized",
    description: "Don't let fatigue interfere with your day.",
    markers: [
      "Homocysteine",
      "Methylmalonic Acid",
      "Iron",
      "Ferritin",
      "Cortisol",
      "Vitamin D",
      "Sex Hormones",
      "Hematocrit",
      "Hemoglobin"
    ],
    icon: "/cdn/shop/files/biomarkers-icon-feel-energized__q_99165d4ee4e7.png"
  },
  {
    title: "Catch disease-risk early",
    description: "Monitor early signs + take action.",
    markers: [
      "LDL",
      "APOB",
      "HDL",
      "TG",
      "HSCRP",
      "Glucose",
      "Insulin",
      "Estradiol",
      "DHEA-S",
      "Albumin",
      "ALT",
      "GGT",
      "Blood Urea Nitrogen",
      "Creatinine",
      "EGFP",
      "CBC",
      "PSA (Male)"
    ],
    icon: "/cdn/shop/files/biomarkers-icon-catch-disease-early__q_6a7f8a117a88.png"
  },
  {
    title: "Prolong your healthy years",
    description: "Track biological age + help slow your speed of aging.",
    markers: ["Speed of Aging", "Biological Organ Age"],
    icon: "/cdn/shop/files/biomarkers-icon-prolong-healthy-years__q_6a7f8a117a88.png",
    badge: "Coming soon"
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
  },
  {
    question: "What biomarkers are included in the baseline and follow-up tests?",
    answer:
      "All customers are tested for up to 140 biomarkers at their baseline test and up to 86 biomarkers at their follow-up test, totaling up to 226 biomarker measurements each year. Men receive 3 additional measurements and women receive 1 additional measurement."
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

      <section className="shell page-section biomarkers-benefits">
        <BiomarkersHealthImpacts
          title="Your health impacts how you feel"
          subtitle="When health is dialed in, the rest follows."
          image="/cdn/shop/files/biomarkers-lp-your-health-desktop__q_ae3e67bdf2c2.webp"
          items={BENEFIT_AREAS}
          ctaHref={START_URL}
        />
      </section>

      <section className="shell page-section biomarkers-platform-feature">
        <div className="biomarkers-platform-feature__header">
          <p className="eyebrow">Biomarkers Bryan Johnson</p>
          <h2>Build your personal health protocol</h2>
          <p>
            One secure platform to test and optimize your health.
            <br />
            The same scientific framework as Bryan Johnson, adapted to your data.
          </p>
        </div>

        <div className="biomarkers-platform-feature__grid">
          <article className="biomarkers-platform-feature__side">
            <div className="biomarkers-platform-feature__phone">
              <img
                src="/cdn/shop/files/Biomarkers_Snapshot_2__q_da23e14c4e4f.png"
                alt="Biomarkers app appointments and test results"
              />
            </div>
            <p>
              Get a snapshot of
              <br />
              your health data
            </p>
          </article>

          <article className="biomarkers-platform-feature__center">
            <div className="biomarkers-platform-feature__dashboard">
              <img
                src="/cdn/shop/files/Group_1597880606__q_a8bb7ad421aa.png"
                alt="Biomarkers dashboard with body systems overview"
              />
            </div>
            <p>
              Learn what each
              <br />
              biomarker means
            </p>
            <a
              href={START_URL}
              className="biomarkers-button biomarkers-button--primary biomarkers-platform-feature__cta"
              target="_blank"
              rel="noreferrer"
            >
              Start now — $1 / day*
            </a>
            <p className="biomarkers-platform-feature__privacy">We always protect your data</p>
          </article>

          <article className="biomarkers-platform-feature__side">
            <div className="biomarkers-platform-feature__phone">
              <img
                src="/cdn/shop/files/AI_Health_Companion_1__q_468edb4f4c15.png"
                alt="AI health companion app"
              />
            </div>
            <p>
              Make an action
              <br />
              plan with AI
            </p>
          </article>
        </div>
      </section>

      <section className="page-section biomarkers-doctor-testimonial">
        <div className="shell biomarkers-doctor-testimonial__inner">
          <div className="biomarkers-doctor-testimonial__portrait">
            <img
              src="/cdn/shop/files/rx-lp-dr-mike-mallin__q_f5163ad2322a.png"
              alt="Dr. Mike Mallin"
            />
          </div>
          <h2>Bryan Johnson&apos;s personal doctor</h2>
          <p className="biomarkers-doctor-testimonial__quote">
            “We spent thousands of hours identifying the biomarkers that actually matter for
            longevity, years of mapping out how they respond to protocols and shift with health
            changes.”
          </p>
          <p className="biomarkers-doctor-testimonial__name">Dr. Mike Mallin</p>
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
        <div className="biomarkers-faq__title-wrap">
          <h2>FAQs</h2>
        </div>

        <div className="biomarkers-faq__layout">
          <div className="biomarkers-faq__label">
            <h3>Getting started</h3>
          </div>
          <BiomarkersFaq items={FAQS} />
        </div>
      </section>

      <section className="biomarkers-footer-cta">
        <a
          href={START_URL}
          className="biomarkers-footer-cta__link"
          target="_blank"
          rel="noreferrer"
        >
          <picture>
            <source
              media="(max-width: 767px)"
              srcSet="/cdn/shop/files/rx-lp-footer-banner-mobile__q_ea4bcfbf2e50.jpg"
            />
            <img
              src="/cdn/shop/files/rx-lp-footer-banner-desktop__q_dcf296e46fc5.jpg"
              alt="Health is forgotten until it's the only thing that matters"
              className="biomarkers-footer-cta__image"
            />
          </picture>
        </a>
        <p className="biomarkers-footer-cta__disclaimer">
          * Billed Annually | Cancel Anytime | HSA/FSA Eligible | Results in a Week
        </p>
      </section>
    </div>
  );
}
