import { notFound } from "next/navigation";
import { CoasPage } from "@/components/coas-page";
import { getCoaPageData } from "@/lib/storefront";

export default function CoaStagingRoute() {
  const data = getCoaPageData();

  if (!data) {
    notFound();
  }

  return <CoasPage data={data} />;
}
