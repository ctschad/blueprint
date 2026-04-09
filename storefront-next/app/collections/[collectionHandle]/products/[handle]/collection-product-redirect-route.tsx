import { redirect } from "next/navigation";

type Params = Promise<{ collectionHandle: string; handle: string }>;

export default async function CollectionProductRedirectRoute({ params }: { params: Params }) {
  const { handle } = await params;
  redirect(`/products/${handle}`);
}
