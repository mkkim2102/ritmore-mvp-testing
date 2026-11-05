import { CartView } from "@/components/store/cart-view"
import { JourneyStep } from "@/components/store/journey-step"
import { Tracker } from "@/components/store/tracker"
import { getRequestContext } from "@/lib/request"
import { privateMetadata } from "@/lib/seo"
import { recordCartView } from "@/lib/track"

export const metadata = privateMetadata("장바구니", "장바구니는 검색 결과에 올리지 않습니다.")

export default async function CartPage() {
  const context = await getRequestContext()
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
      <CartView />
    </div>
  )
}
