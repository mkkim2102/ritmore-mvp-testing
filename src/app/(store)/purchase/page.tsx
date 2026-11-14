import { Suspense } from "react"
import { PurchaseSummary } from "@/components/store/purchase-summary"
import { JourneyStep } from "@/components/store/journey-step"
import { privateMetadata } from "@/lib/seo"

export const metadata = privateMetadata("주문 확인", "담긴 상품과 금액을 확인합니다.")

export default function PurchasePage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-10">
      <div className="space-y-2">
        <JourneyStep step="주문 확인" />
        <h1 className="font-serif text-4xl">주문 확인</h1>
        <p className="text-sm leading-6 text-[#111111]">현재는 출시 준비 중으로 주문과 결제를 받지 않습니다.</p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">상품과 금액을 확인하는 중입니다.</p>}>
        <PurchaseSummary />
      </Suspense>
    </div>
  )
}
