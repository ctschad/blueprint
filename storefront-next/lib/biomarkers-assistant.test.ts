import { describe, expect, it } from "vitest";
import {
  BIOMARKERS_ASSISTANT_FALLBACK,
  buildBiomarkersPrompt,
  isBiomarkersRelatedQuestion,
  normalizeBiomarkersQuestion,
  shouldRefuseBiomarkersQuestion
} from "@/lib/biomarkers-assistant";

describe("biomarkers assistant guardrails", () => {
  it("accepts general educational biomarker questions for tested markers", () => {
    expect(isBiomarkersRelatedQuestion("What is hematocrit?")).toBe(true);
    expect(shouldRefuseBiomarkersQuestion("What is hematocrit?")).toBe(false);
    expect(shouldRefuseBiomarkersQuestion("How does iron work in the blood?")).toBe(false);
  });

  it("refuses personalized medical advice questions", () => {
    expect(shouldRefuseBiomarkersQuestion("My hematocrit is high, what should I do?")).toBe(true);
    expect(shouldRefuseBiomarkersQuestion("Should I take magnesium for sleep?")).toBe(true);
  });

  it("normalizes common biomarker aliases", () => {
    expect(normalizeBiomarkersQuestion("Does EGFP matter more than TG or APOB?")).toBe(
      "Does eGFR matter more than triglycerides or ApoB?"
    );
  });

  it("embeds the fallback sentence into the generated prompt", () => {
    const prompt = buildBiomarkersPrompt("Tell me about ferritin", []);

    expect(prompt).toContain(BIOMARKERS_ASSISTANT_FALLBACK);
    expect(prompt).toContain("You may explain, in general and non-personalized terms, what a tested biomarker is");
  });
});
