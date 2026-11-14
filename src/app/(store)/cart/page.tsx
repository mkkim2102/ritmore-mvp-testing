import { CartView } from "@/components/store/cart-view"
import { JourneyStep } from "@/components/store/journey-step"
import { privateMetadata } from "@/lib/seo"

export const metadata = privateMetadata("장바구니", "장바구니는 검색 결과에 올리지 않습니다.")

export default function CartPage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10">
      <div className="space-y-2">
        <JourneyStep step="장바구니" />
        <h1 className="font-serif text-4xl">장바구니</h1>
      </div>
      <CartView />
    </div>
  )
}
