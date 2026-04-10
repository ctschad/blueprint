const SUBSCRIPTION_INELIGIBLE_HANDLES = new Set([
  "laser-cap",
  "blueprint-crewneck",
  "blueprint-hat",
  "blueprint-hoodie",
  "blueprint-pink-crewneck",
  "blueprint-t-shirt",
  "death-is-our-only-foe-t-shirt",
  "dont-die-crewneck",
  "dont-die-grunge-t-shirt",
  "dont-die-t-shirt",
  "evolution-of-human-t-shirt",
  "skull-kick-hoodie",
  "spout",
  "super-veggie-t-shirt"
]);

export function isSubscriptionEligible(productHandle: string) {
  return !SUBSCRIPTION_INELIGIBLE_HANDLES.has(productHandle);
}

