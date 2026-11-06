import Link from "next/link"
import { CheckoutForm } from "@/components/store/checkout-form"
import { JourneyStep } from "@/components/store/journey-step"
import { Tracker } from "@/components/store/tracker"
import { buttonVariants } from "@/components/ui/button"
import { parseItems, priceLines } from "@/lib/catalog"
import { won } from "@/lib/format"
import { cn } from "@/lib/utils"
import { getRequestContext } from "@/lib/request"
import { privateMetadata } from "@/lib/seo"

export const metadata = privateMetadata("결제", "결제 화면은 검색 결과에 올리지 않습니다.")

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ items?: string }>
}) {
  const query = await searchParams
  const context = await getRequestContext()
  const lines = priceLines(parseItems(query.items), context.touch)

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-10">
      {lines.length > 0 ? (
        <Tracker step="checkout_view" productSlugList={lines.map((line) => line.product.slug).join(",")} />
      ) : (
        <Tracker />
      )}
      <div className="space-y-2">
        <JourneyStep step="주문 확인" />
        <h1 className="font-serif text-4xl">주문 확인</h1>
        <p className="text-sm leading-6 text-[#111111]">담긴 상품과 금액을 확인해 주세요.</p>
      </div>
      {lines.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <p className="font-serif text-2xl">담긴 제품이 없습니다</p>
          <Link href="/products/buy1" className={cn(buttonVariants(), "mt-6 h-11 px-4")}>
            제품 보기
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr]">
          <ul className="space-y-3 rounded-2xl border border-border bg-card p-4">
            {lines.map((line) => (
              <li key={line.product.id} className="flex items-start justify-between gap-3 text-sm">
                <span>
                  {line.product.name}
                  <span className="text-muted-foreground"> × {line.qty}</span>
                </span>
                <span className="tabular-nums">{won(line.offer.price * line.qty)}</span>
              </li>
            ))}
          </ul>
          <CheckoutForm
            lines={lines.map((line) => ({
              slug: line.product.slug,
              name: line.product.name,
              qty: line.qty,
              price: line.offer.price,
            }))}
          />
        </div>
      )}
    </div>
  )
}
