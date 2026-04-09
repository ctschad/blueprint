import { notFound } from "next/navigation";
import { CmsPageView } from "@/components/cms-page-view";
import { getPageByHandle } from "@/lib/storefront";

type Params = Promise<{ handle: string }>;

export default async function CmsPageRoute({ params }: { params: Params }) {
  const { handle } = await params;
  const page = getPageByHandle(handle);
  if (!page) {
    notFound();
  }

  return <CmsPageView page={page} />;
}
