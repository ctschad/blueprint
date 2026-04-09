import { notFound } from "next/navigation";
import { BuildMyStackPage, type BuildMyStackItem } from "@/components/build-my-stack-page";
import { getProductsByHandles, getProductsForCollection } from "@/lib/storefront";

const STARTER_STACK_HANDLES = ["easy-stack", "medium-stack", "big-stack"] as const;

export default function BuildMyStackRoute() {
  const products = getProductsForCollection("bundle-builder").filter((product) => product.available);
  const starterProducts = getProductsByHandles([...STARTER_STACK_HANDLES]);
  const starterByHandle = new Map(starterProducts.map((product) => [product.handle, product]));

  if (products.length === 0) {
    notFound();
  }

  const items: BuildMyStackItem[] = products.map((product) => ({
    product,
    badge: product.collectionHandles.includes("bestsellers") ? "Bestseller" : undefined
  }));
  const starterStacks = STARTER_STACK_HANDLES.map((handle) => starterByHandle.get(handle)).filter(
    (item): item is (typeof starterProducts)[number] => Boolean(item)
  );

  if (starterStacks.length !== STARTER_STACK_HANDLES.length) {
    notFound();
  }

  return <BuildMyStackPage items={items} starterStacks={starterStacks} />;
}
