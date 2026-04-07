const headerMegaMenuQuickLinks = [
  { label: "Shop All", href: "/collections/all-products" },
  { label: "Bestsellers", href: "/collections/bestsellers" },
  { label: "Build my Stack", href: "/pages/build-my-stack" }
] as const;

const headerMegaMenuFeatureCards = [
  {
    title: "Start Quiz",
    href: "/pages/protocol-quiz",
    image: "/media/menu/quiz-promo.webp",
    alt: "Take the protocol quiz"
  },
  {
    title: "Subscribe & Save 5%",
    href: "/collections/all-products",
    image: "/media/menu/subscribe-save-promo.png",
    alt: "Subscribe and save promotion"
  }
] as const;

export const shopByCategoryMenu = {
  quickLinks: headerMegaMenuQuickLinks,
  groups: [
    {
      title: "Nutrition",
      href: "/collections/nutrition",
      items: [
        { label: "Olive Oil", href: "/products/extra-virgin-olive-oil" },
        { label: "Metabolic Protein", href: "/products/metabolic-protein-powder" },
        { label: "Longevity Protein", href: "/products/longevity-protein-chocolate" },
        { label: "Macadamia Protein Bars", href: "/products/macadamia-protein-bar" },
        { label: "Blueberry Nut Mix", href: "/products/nutty-pudding-fruit-and-nut-mix" },
        { label: "Super Shrooms", href: "/products/super-shrooms" },
        { label: "Raw Macadamias", href: "/products/raw-macadamias" },
        { label: "Ceremonial Grade Matcha", href: "/products/ceremonial-matcha" },
        { label: "Cocoa Powder", href: "/products/cocoa-powder" }
      ]
    },
    {
      title: "Supplements",
      href: "/collections/supplements",
      items: [
        {
          label: "Longevity Mix",
          href: "/products/longevity-blend-multinutrient-drink-mix-blood-orange-flavor"
        },
        { label: "Creatine", href: "/products/creatine" },
        { label: "Ashwagandha + Rhodiola", href: "/products/ashwagandha-rhodiola-120mg" },
        { label: "NAC + Ginger + Curcumin", href: "/products/nac-ginger-capsules" },
        { label: "Essential Capsules", href: "/products/essentials-capsules" },
        { label: "Advanced Antioxidants", href: "/products/advanced-antioxidants" },
        { label: "Collagen Peptides", href: "/products/collagen" },
        { label: "Omega-3", href: "/products/omega-3" }
      ]
    },
    {
      title: "Skincare",
      href: "/collections/skincare",
      items: [
        { label: "Gentle Cleanser", href: "/products/facial-cleanser" },
        { label: "Facial Moisturizer", href: "/products/facial-moisturizer" },
        { label: "Facial Serum", href: "/products/facial-serum" }
      ]
    },
    {
      title: "Haircare",
      href: "/collections/haircare",
      items: [
        { label: "302 Laser Cap", href: "/products/laser-cap" },
        { label: "Peptide Serum", href: "/products/hair-peptide-serum" },
        { label: "Peptide Shampoo", href: "/products/hair-peptide-shampoo" }
      ]
    }
  ],
  utilityLinks: [
    { label: "Curated Bundles", href: "/collections/stacks" },
    { label: "Blueprint Merch", href: "/collections/merch" },
    { label: "Meal Delivery", href: "https://meals.bryanjohnson.com/get-started", external: true },
    { label: "Biomarkers", href: "/pages/biomarkers" }
  ],
  featureCards: headerMegaMenuFeatureCards
} as const;

export const shopByBenefitMenu = {
  quickLinks: headerMegaMenuQuickLinks,
  title: "Shop by Benefit",
  items: [
    { label: "Daily Health & Longevity", href: "/collections/daily-health-longevity" },
    { label: "Brain & Heart Health", href: "/collections/brain-heart-health" },
    { label: "Energy & Stress Support", href: "/collections/energy-stress-support" },
    { label: "Muscle Performance & Recovery", href: "/collections/muscle-performance-recovery" },
    { label: "Nutritional Support", href: "/collections/nutritional-support" },
    { label: "Gut & Immune Health Support", href: "/collections/gut-immune-support" },
    { label: "Hair & Skincare", href: "/collections/hair-and-skin-care" }
  ],
  featureCards: headerMegaMenuFeatureCards
} as const;

export const homeContent = {
  topBanner: {
    title: "Longevity protocols from Bryan Johnson",
    description: "Science-backed, precision-dosed, no BS",
    ctaLabel: "Get Yours",
    ctaHref: "/collections/all-products",
    image: {
      src: "/media/home/home-top-banner.jpg",
      alt: "Longevity Mix pouch and Essential Capsules bottle on a concrete surface"
    }
  },
  everyBodyBanner: {
    titleLineOne: "Every product is",
    titleLineTwo: "designed for every",
    emphasis: "body.",
    image: {
      src: "/media/home/every-body-banner.jpg",
      alt: "Four people standing together against a blue sky"
    },
    items: [
      { key: "studies" as const, label: "BUILT ON POPULATION LEVEL STUDIES" },
      { key: "life" as const, label: "EVERY INGREDIENT FOUGHT FOR ITS LIFE™" },
      { key: "experts" as const, label: "ENGINEERED BY LONGEVITY EXPERTS AND DOCTORS" }
    ]
  },
  newsletter: {
    eyebrow: "Blueprint Newsletter",
    heading: "Health protocols that actually work",
    description: "We will teach you how to be healthy, for free.",
    placeholder: "Your email address",
    image: {
      src: "/media/home/newsletter-signup.jpg",
      alt: "Woman in a light blue sweater against a dark blue sky"
    }
  },
  hero: {
    eyebrow: "Clinically-backed ingredients",
    heading: "The world's most tested longevity protocols.",
    description:
      "The food system is broken. Up to 90% of supplements are mislabeled and full of hidden toxins. We test every ingredient, publish every result, and make transparency non-negotiable.",
    title: "Our Standards",
    resultsLabel: "View Our Test Results",
    resultsHref: "/pages/coas",
    footnote: "*COAs are property of Blueprint and are not to be used without Blueprint's consent.",
    image: {
      src: "/media/home/our-standards-petri-dishes.jpg",
      alt: "Four glass bowls containing different powders and liquids on a light stone surface"
    },
    capsuleImage: {
      src: "/media/home/standards-capsule.png",
      alt: "Transparent capsule filled with antioxidant powder"
    },
    items: [
      {
        title: "No Label Fluff",
        description: "Marketing claims on products that are suspicious and misleading."
      },
      {
        title: "No Pixie Dusting",
        description: "Ingredients added at doses too small to matter, just to decorate the label."
      },
      {
        title: "No Shortcuts",
        description: "We test for heavy metals, toxins, and contaminants that other brands often ignore."
      }
    ]
  },
  collectionTabs: [
    { handle: "daily-health-longevity", label: "Daily Health & Longevity" },
    { handle: "brain-heart-health", label: "Brain & Heart Health" },
    { handle: "energy-stress-support", label: "Energy & Stress Support" },
    { handle: "muscle-performance-recovery", label: "Muscle Performance & Recovery" },
    { handle: "nutritional-support", label: "Nutritional Support" },
    { handle: "gut-immune-support", label: "Gut & Immune Health Support" },
    { handle: "hair-and-skin-care", label: "Hair & Skin Care" }
  ],
  bodyCollections: [
    "all-products",
    "daily-health-longevity",
    "brain-heart-health",
    "energy-stress-support",
    "muscle-performance-recovery",
    "gut-immune-support"
  ],
  testimonials: [
    {
      title: "Changed My Life",
      quote:
        "Since starting the Blueprint program in 2025 I have lost over 50 lbs and taken control of my health."
    },
    {
      title: "Great Product & Service",
      quote:
        "Everything feels intentional, from the formulations to the shipping experience and the transparency around testing."
    },
    {
      title: "High Quality Products at Generous Prices",
      quote:
        "The products feel premium without relying on vague wellness language. You can tell there is actual discipline behind them."
    },
    {
      title: "Portal to a Better Life",
      quote:
        "The protocols make healthy choices easier to repeat, which is what turns good intentions into a daily routine."
    },
    {
      title: "Easy To Stick With",
      quote:
        "The routine feels organized, the formulations feel intentional, and the whole experience makes healthy choices easier to repeat."
    }
  ],
  routineHandles: [
    "longevity-blend-multinutrient-drink-mix-blood-orange-flavor",
    "essentials-capsules",
    "advanced-antioxidants",
    "extra-virgin-olive-oil",
    "omega-3"
  ]
};
