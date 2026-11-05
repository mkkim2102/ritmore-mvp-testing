import { parseItems, priceLines } from "@/lib/catalog"
import { getRequestContext } from "@/lib/request"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const context = await getRequestContext()
  const lines = priceLines(parseItems(url.searchParams.get("items")), context.touch)
  return Response.json({
    lines: lines.map((line) => ({
      slug: line.product.slug,
      name: line.product.name,
      qty: line.qty,
      price: line.offer.price,
      compareAtPrice: line.offer.compareAtPrice,
    })),
  })
}
