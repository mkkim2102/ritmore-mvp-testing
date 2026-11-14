"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { parseItems, priceItems } from "@/components/store/cart-store"
import { buttonVariants } from "@/components/ui/button"
import { won } from "@/lib/format"
import { cn } from "@/lib/utils"

export function PurchaseSummary() {
  const query = useSearchParams()
  const lines = priceItems(parseItems(query.get("items")))
  const total = lines.reduce((sum, line) => sum + line.price * line.qty, 0)

  return (
    <div className="space-y-6">
      {lines.length > 0 ? (
        <div className="rounded-2xl border border-border bg-card px-4">
          <ul className="divide-y divide-border">
            {lines.map((line) => (
              <li key={line.slug} className="flex justify-between gap-3 py-4 text-sm">
                <span>{line.name} <span className="text-muted-foreground">× {line.qty}</span></span>
                <span className="tabular-nums">{won(line.price * line.qty)}</span>
              </li>
            ))}
          </ul>
          <p className="flex justify-between gap-3 border-t border-border py-4 font-medium">
            <span>상품 합계</span>
            <span className="tabular-nums" data-purchase-total={total}>{won(total)}</span>
          </p>
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
          담긴 제품이 없습니다.
        </p>
      )}
      <Link href="/products" className={cn(buttonVariants(), "h-11 px-4")}>
        상품 보기
      </Link>
    </div>
  )
}
