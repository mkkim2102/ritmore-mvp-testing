import Link from "next/link"
import { JourneyStep } from "@/components/store/journey-step"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { privateMetadata } from "@/lib/seo"

export const metadata = privateMetadata("완료", "결제 뒤 화면은 검색 결과에 올리지 않습니다.")

export default function CheckoutDonePage() {
  return (
    <div className="mx-auto w-full max-w-xl space-y-5 px-4 py-16">
      <JourneyStep step="완료" />
      <h1 className="font-serif text-4xl">확인을 마쳤습니다</h1>
      <p className="leading-7 text-[#111111]">상품 페이지에서 내용을 다시 볼 수 있습니다.</p>
      <Link href="/products/sample-a" className={cn(buttonVariants(), "h-11 px-4")}>
        제품으로 돌아가기
      </Link>
    </div>
  )
}
