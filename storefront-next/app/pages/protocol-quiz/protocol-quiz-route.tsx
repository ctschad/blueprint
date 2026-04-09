import { notFound } from "next/navigation";
import { ProtocolQuizPage } from "@/components/protocol-quiz-page";
import { getProductsByHandles } from "@/lib/storefront";

const QUIZ_PRODUCT_HANDLES = [
  "easy-stack",
  "medium-stack",
  "big-stack",
  "longevity-blend-multinutrient-drink-mix-blood-orange-flavor",
  "essentials-capsules",
  "advanced-antioxidants",
  "extra-virgin-olive-oil"
] as const;

export default function ProtocolQuizRoute() {
  const products = getProductsByHandles([...QUIZ_PRODUCT_HANDLES]);

  if (products.length !== QUIZ_PRODUCT_HANDLES.length) {
    notFound();
  }

  return <ProtocolQuizPage products={products} />;
}
