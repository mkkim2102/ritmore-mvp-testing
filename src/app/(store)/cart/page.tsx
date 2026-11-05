import { cookies } from "next/headers"
import { CartView } from "@/components/store/cart-view"
import { CART_COOKIE } from "@/components/store/cart-store"
import { JourneyStep } from "@/components/store/journey-step"
import { Tracker } from "@/components/store/tracker"
import { parseItems, priceLines } from "@/lib/catalog"
import { getRequestContext } from "@/lib/request"
import { privateMetadata } from "@/lib/seo"
import { recordCartView } from "@/lib/track"

export const metadata = privateMetadata("장바구니", "장바구니는 검색 결과에 올리지 않습니다.")

export default async function CartPage() {
  const context = await getRequestContext()
  const stored = (await cookies()).get(CART_COOKIE)?.value
  const initialLines = priceLines(parseItems(stored), context.touch).map((line) => ({
    slug: line.product.slug,
    name: line.product.name,
    qty: line.qty,
    price: line.offer.price,
    compareAtPrice: line.offer.compareAtPrice,
  }))
  recordCartView({
    path: "/cart",
    visitorId: context.visitorId,
    sessionId: context.sessionId,
    preview: context.preview,
    prefetch: context.prefetch,
    document: context.document,
    returned: context.returned,
    touch: context.touch,
  })

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10">
      <Tracker />
      <div className="space-y-2">
        <JourneyStep step="장바구니" />
        <h1 className="font-serif text-4xl">장바구니</h1>
      </div>
      <CartView initialLines={initialLines} />
    </div>
  )
}
