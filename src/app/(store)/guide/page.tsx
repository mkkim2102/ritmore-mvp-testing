import type { Metadata } from "next"
import { guideSections } from "@/lib/shop-guide"
import { allowIndex, publicMetadata } from "@/lib/seo"

export const metadata: Metadata = publicMetadata({
  title: "이용안내 | 리트모어",
  description: "리트모어의 주문, 결제, 배송, 교환, 환불 안내입니다.",
  path: "/guide",
  index: allowIndex(false),
})

export default function GuidePage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <p className="text-xs font-medium text-[#111111]">이용안내</p>
      <h1 className="mt-2 text-3xl text-[#111111] md:text-4xl">주문부터 환불까지</h1>
      <p className="mt-4 leading-7 text-[#111111]">
        주문, 결제, 배송, 교환, 환불 안내입니다. 금액과 기간처럼 적지 않은 내용은 주문 화면의 안내를 따릅니다.
      </p>
      <div className="mt-10 divide-y divide-border border-y border-border">
        {guideSections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-32 py-6">
            <h2 className="text-xl text-[#111111]">{section.title}</h2>
            <p className="mt-3 text-sm leading-7 text-[#111111]">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
