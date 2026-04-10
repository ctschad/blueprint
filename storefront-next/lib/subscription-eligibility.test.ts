import { describe, expect, it } from "vitest";
import { isSubscriptionEligible } from "@/lib/subscription-eligibility";

describe("isSubscriptionEligible", () => {
  it("allows normal supplement products to remain subscription eligible", () => {
    expect(isSubscriptionEligible("essentials-capsules")).toBe(true);
    expect(isSubscriptionEligible("longevity-blend-multinutrient-drink-mix-blood-orange-flavor")).toBe(true);
  });

  it("blocks merch and device products from subscription", () => {
    expect(isSubscriptionEligible("blueprint-t-shirt")).toBe(false);
    expect(isSubscriptionEligible("super-veggie-t-shirt")).toBe(false);
    expect(isSubscriptionEligible("blueprint-hat")).toBe(false);
    expect(isSubscriptionEligible("laser-cap")).toBe(false);
  });
});

