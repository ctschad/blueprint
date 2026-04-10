import { searchCatalog } from "@/lib/storefront";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return Response.json({ articles: [], products: [] });
  }

  return Response.json(searchCatalog(query));
}
