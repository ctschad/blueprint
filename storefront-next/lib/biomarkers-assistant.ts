export type BiomarkersAssistantTurn = {
  role: "user" | "assistant";
  content: string;
};

export const BIOMARKERS_HEALTH_IMPACTS_HASH = "#health-impacts";
export const BIOMARKERS_ASSISTANT_FALLBACK =
  "I can only answer questions about Blueprint Biomarkers and what we test.";
export const BIOMARKERS_ASSISTANT_UNAVAILABLE =
  "The local Biomarkers assistant isn’t available right now.";

const RELATED_KEYWORDS = [
  "biomarker",
  "biomarkers",
  "test",
  "testing",
  "what do you test",
  "what do you measure",
  "measure",
  "measurement",
  "measurements",
  "lab",
  "labs",
  "blood",
  "urine",
  "membership",
  "subscription",
  "subscribe",
  "price",
  "cost",
  "hsa",
  "fsa",
  "results",
  "follow-up",
  "follow up",
  "baseline",
  "retest",
  "how it works",
  "platform",
  "health companion",
  "import past labs",
  "upload",
  "snapshot",
  "cortisol",
  "vitamin d",
  "omega-3",
  "omega 3",
  "omega-6",
  "omega 6",
  "homocysteine",
  "methylmalonic acid",
  "magnesium",
  "zinc",
  "iron",
  "ferritin",
  "thyroid",
  "thyroid function",
  "hemoglobin",
  "hematocrit",
  "heavy metals",
  "hscrp",
  "hs-crp",
  "hba1c",
  "a1c",
  "insulin",
  "glucose",
  "ldl",
  "apob",
  "apo b",
  "hdl",
  "triglycerides",
  "tg",
  "estradiol",
  "dhea-s",
  "dheas",
  "sex hormones",
  "albumin",
  "alt",
  "ggt",
  "blood urea nitrogen",
  "bun",
  "creatinine",
  "egfr",
  "egfp",
  "cbc",
  "complete blood count",
  "psa",
  "prostate specific antigen",
  "speed of aging",
  "biological organ age",
  "why do you test",
  "why is it important",
  "why does it matter",
  "indicator of health",
  "mood",
  "mind",
  "energized",
  "disease-risk",
  "healthy years",
  "bryan johnson"
];

const DISALLOWED_PATTERNS = [
  /\bdiagnos/i,
  /\btreat/i,
  /\bcure/i,
  /\bprescrib/i,
  /\bmedication/i,
  /\bmedicine/i,
  /\bdosage\b/i,
  /\bdose\b/i,
  /\bsupplement should i\b/i,
  /\bwhat should i take\b/i,
  /\bwhat should i do\b/i,
  /\bshould i\b/i,
  /\bam i\b/i,
  /\bis this dangerous\b/i,
  /\bdo i have\b/i,
  /\binterpret my\b/i,
  /\bwhat does my .* mean\b/i,
  /\bhigh cortisol\b/i,
  /\blow testosterone\b/i,
  /\bsymptom/i,
  /\bpain\b/i,
  /\billness\b/i,
  /\bdisease\b(?!-risk)/i,
  /\bdoctor\b/i,
  /\bmedical advice\b/i,
  /\bhealth advice\b/i
];

export function isBiomarkersRelatedQuestion(question: string) {
  const normalized = question.trim().toLowerCase();
  if (!normalized) return false;

  return RELATED_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export function isDisallowedBiomarkersQuestion(question: string) {
  return DISALLOWED_PATTERNS.some((pattern) => pattern.test(question));
}

export function shouldRefuseBiomarkersQuestion(question: string) {
  return isDisallowedBiomarkersQuestion(question) || !isBiomarkersRelatedQuestion(question);
}

export function normalizeBiomarkersQuestion(question: string) {
  return question
    .replace(/\bEGFP\b/gi, "eGFR")
    .replace(/\bTG\b/g, "triglycerides")
    .replace(/\bAPOB\b/g, "ApoB")
    .replace(/\bHBA1C\b/g, "HbA1c")
    .replace(/\bPSA\s*\(Male\)\b/gi, "PSA");
}

const BIOMARKERS_FACTS = `
Blueprint Biomarkers facts:
- Biomarkers is a Blueprint program for testing, organizing, and revisiting biomarkers over time.
- The Biomarkers membership is $365 per year, about $1 per day, and is HSA/FSA eligible.
- The membership includes two comprehensive blood panels and urine tests per year.
- The program measures 100+ biomarkers and 160+ measurements.
- Most people receive results in about a week.
- The platform lets users securely store data, including past labs, upload older lab results, and use an AI health companion.
- The workflow is: baseline testing, import past labs, build an action plan, and retest after six months.

Health impact areas and what they include:
- Master your mood: cortisol, vitamin D, omega-3, omega-6, homocysteine, magnesium, zinc, ferritin, thyroid function.
- Sharpen your mind: vitamin D, omega-3, homocysteine, methylmalonic acid, ferritin, hemoglobin, hematocrit, thyroid function, heavy metals, HSCRP, HbA1c, insulin, magnesium.
- Feel energized: homocysteine, methylmalonic acid, iron, ferritin, cortisol, vitamin D, sex hormones, hematocrit, hemoglobin.
- Catch disease-risk early: LDL, ApoB, HDL, triglycerides, HSCRP, glucose, insulin, estradiol, DHEA-S, albumin, ALT, GGT, blood urea nitrogen, creatinine, EGFR, CBC, PSA (male).
- Prolong your healthy years: speed of aging, biological organ age. This is marked as coming soon.

General biomarker explanations you may use:
- Cortisol is a stress hormone. Blueprint tests it because it can help reflect how the body is responding to stress load and recovery demands.
- Vitamin D supports immune function, bone health, and broader physiologic regulation. Blueprint tests it because low or imbalanced levels can affect multiple health domains.
- Omega-3 is a fatty acid involved in brain, cardiovascular, and cell-membrane health. Blueprint tests it because it can provide useful context about long-term nutrition and inflammatory balance.
- Omega-6 is a fatty acid involved in cell signaling, inflammation, and membrane health. Blueprint tests it because the balance between omega-6 and omega-3 can help reflect broader metabolic and inflammatory patterns.
- Homocysteine is an amino acid tied to methylation and cardiovascular risk context. Blueprint tests it because it can help flag whether key nutrient and metabolic pathways are functioning well.
- Magnesium is a mineral involved in muscle, nerve, energy, and metabolic function. Blueprint tests it because it supports many systems tied to mood, energy, and performance.
- Zinc is a mineral involved in immune function, repair, and enzyme activity. Blueprint tests it because it helps support recovery and overall physiologic resilience.
- Ferritin reflects stored iron. Blueprint tests it because it provides context about iron reserves and can help explain energy and oxygen-transport patterns.
- Iron supports hemoglobin production and oxygen transport in the blood. Blueprint tests it because it is central to energy, endurance, and red blood cell function.
- Hemoglobin is the oxygen-carrying protein in red blood cells. Blueprint tests it because it helps show how effectively blood can carry oxygen.
- Hematocrit is the percentage of blood volume made up of red blood cells. Blueprint tests it because it helps provide context about oxygen-carrying capacity and red blood cell concentration.
- Thyroid function reflects the hormone system that helps regulate metabolism, temperature, and energy use. Blueprint tests it because thyroid status can shape mood, energy, and broader metabolic health.
- Methylmalonic acid is a metabolite often used as context for vitamin B12-related physiology. Blueprint tests it because it can help explain energy, blood, and neurologic patterns.
- Heavy metals testing helps screen for exposures that can affect neurologic and metabolic health. Blueprint tests it because environmental burden can influence how people feel and perform.
- HSCRP is a marker associated with systemic inflammation. Blueprint tests it because inflammation can affect cardiovascular, metabolic, and recovery-related health patterns.
- HbA1c reflects average blood glucose exposure over time. Blueprint tests it because it helps provide long-term context about blood sugar regulation.
- Insulin helps regulate blood glucose and energy storage. Blueprint tests it because it offers context on metabolic function and blood sugar control.
- Glucose is the primary sugar circulating in the blood. Blueprint tests it because it is central to metabolic health and energy regulation.
- LDL is a lipoprotein marker often used to understand cholesterol transport and cardiovascular risk context. Blueprint tests it because it helps assess cardiometabolic patterns over time.
- HDL is a lipoprotein marker tied to cholesterol transport and cardiometabolic health context. Blueprint tests it because it helps round out the broader lipid picture.
- Triglycerides are a type of fat circulating in the blood. Blueprint tests them because they help provide context about metabolic and cardiovascular health.
- ApoB is a marker of atherogenic lipoprotein particle burden. Blueprint tests it because it can help refine cardiovascular risk context beyond standard cholesterol measures alone.
- LDL, HDL, triglycerides, and ApoB together are lipid-related markers tied to cardiovascular risk context. Blueprint tests them because they help assess lipoprotein patterns relevant to long-term cardiometabolic health.
- Estradiol is a sex hormone involved in reproductive and broader metabolic physiology. Blueprint tests it because hormone balance shapes energy, recovery, and long-term health context.
- DHEA-S is an adrenal-linked hormone marker. Blueprint tests it because it can provide context about hormone status, resilience, and broader physiologic balance.
- TG is shorthand for triglycerides.
- ApoB is shorthand for apolipoprotein B.
- HbA1c is also commonly referred to as A1c.
- eGFR is a kidney-filtration estimate. If a user asks about EGFP in the Blueprint Biomarkers context, treat that as referring to eGFR because the page currently uses that label.
- PSA stands for prostate-specific antigen.
- Estradiol, DHEA-S, and other sex hormones help regulate reproduction, energy, body composition, and recovery. Blueprint tests them because hormone status shapes many aspects of health and performance.
- Albumin is a major blood protein tied to fluid balance and liver-related context. Blueprint tests it because it offers a broad snapshot of nutritional and physiologic status.
- ALT and GGT are enzymes often used as liver-related markers. Blueprint tests them because they help provide context about liver function and metabolic stress.
- ALT is a liver-related enzyme. Blueprint tests it because it helps provide context about liver function and metabolic stress.
- GGT is a liver- and bile-duct-related enzyme marker. Blueprint tests it because it can help provide context about liver stress and metabolic strain.
- Blood urea nitrogen, creatinine, and eGFR are kidney-related markers. Blueprint tests them because they help indicate how well the kidneys are filtering and processing waste.
- Blood urea nitrogen, or BUN, reflects a waste product related to protein metabolism. Blueprint tests it because it helps provide kidney and hydration-related context.
- Creatinine is a waste product used as a standard kidney-function marker. Blueprint tests it because it helps indicate how well the kidneys are filtering blood.
- CBC, or complete blood count, is a panel that includes measurements related to red cells, white cells, and platelets. Blueprint tests it because it gives a broad view of blood and immune-related status.
- CBC stands for complete blood count.
- PSA, for males, is a prostate-related marker. Blueprint tests it as part of early disease-risk context.
- Speed of aging is a higher-level estimate intended to reflect how quickly aging-related changes may be occurring over time.
- Biological organ age is a higher-level estimate intended to summarize how specific organ systems compare with age-related patterns.

Important safety rules:
- You may give general, non-diagnostic educational explanations of the biomarkers Blueprint tests, what those biomarkers do, why Blueprint measures them, and what kinds of health domains they can help reflect.
- Do not give medical advice, diagnoses, treatment plans, supplement recommendations, or instructions about what a person personally should do with their lab results.
- Do not interpret a user's personal biomarker values or tell them whether their own result is good, bad, dangerous, normal, or abnormal.
- Only answer questions about Blueprint Biomarkers, the Biomarkers membership, the platform, the workflow, what Blueprint tests, and general educational explanations of those tested biomarkers.
`.trim();

export function buildBiomarkersPrompt(
  question: string,
  history: BiomarkersAssistantTurn[]
) {
  const transcript = history
    .slice(-6)
    .map((turn) => `${turn.role === "user" ? "User" : "Assistant"}: ${turn.content}`)
    .join("\n");

  return `
You are the Blueprint Biomarkers assistant.

Rules:
- Only answer questions about Blueprint Biomarkers, the Biomarkers membership, the testing workflow, the platform, what Blueprint tests, and general educational explanations of the biomarkers Blueprint tests.
- You may explain, in general and non-personalized terms, what a tested biomarker is, why Blueprint tests it, what it does, and what area of health it can help reflect.
- Never provide medical advice, diagnoses, treatment plans, supplement recommendations, or personal interpretations of lab results.
- If the question asks for health advice, asks you to interpret a person's results, or is unrelated to Blueprint Biomarkers, respond with exactly this sentence and nothing else:
${BIOMARKERS_ASSISTANT_FALLBACK}
- If the answer is not explicitly supported by the reference facts, respond with exactly:
${BIOMARKERS_ASSISTANT_FALLBACK}
- Keep answers concise, direct, and under 140 words.

Reference facts:
${BIOMARKERS_FACTS}

Conversation so far:
${transcript || "No prior conversation."}

User question:
${question}
`.trim();
}

export function normalizeBiomarkersAssistantResponse(response: string) {
  const cleaned = response.replace(/\s+/g, " ").trim();
  return cleaned || BIOMARKERS_ASSISTANT_FALLBACK;
}
