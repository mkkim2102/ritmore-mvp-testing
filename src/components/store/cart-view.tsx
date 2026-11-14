"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  itemsQuery,
  priceItems,
  readCart,
  removeCartItem,
  setCartQty,
  writeCart,
  type CartItem,
} from "@/components/store/cart-store"
import { won } from "@/lib/format"
import { MAX_QTY } from "@/lib/qty"
import { cn } from "@/lib/utils"

export function CartView() {
  const [items, setItems] = useState<CartItem[] | null>(null)

  useEffect(() => {
    const sync = () => setItems(readCart())
    sync()
    window.addEventListener("storelab-cart", sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener("storelab-cart", sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  if (items === null) {
    return <p className="text-sm text-muted-foreground">장바구니를 불러오는 중입니다.</p>
  }

  const lines = priceItems(items)
  if (lines.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
        <p className="font-serif text-2xl">장바구니가 비어 있습니다</p>
        <p className="mt-2 text-sm text-muted-foreground">상품 페이지에서 담으면 가격이 여기에 나옵니다.</p>
        <Button className="mt-6 h-11" render={<Link href="/products/buy1" />}>
          제품 보기
        </Button>
      </div>
    )
  }

  const total = lines.reduce((sum, line) => sum + line.price * line.qty, 0)

  return (
    <div className="space-y-6">
      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {lines.map((line) => (
          <li
            key={line.slug}
            data-cart-line={line.slug}
            className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-medium" data-cart-name>
                {line.name}
              </p>
              <p className="text-sm text-muted-foreground tabular-nums" data-cart-unit={line.price}>
                실판매가 {won(line.price)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center rounded-xl border border-[#e5e5e5] bg-white" data-qty-max={MAX_QTY}>
                <button
                  type="button"
                  className="h-10 w-10 text-lg disabled:opacity-30"
                  onClick={() => writeCart(setCartQty(lines, line.slug, line.qty - 1))}
                  disabled={line.qty <= 1}
                  aria-label="수량 줄이기"
                >
                  −
                </button>
                <span className="w-8 text-center tabular-nums" data-qty>
                  {line.qty}
                </span>
                <button
                  type="button"
                  className="h-10 w-10 text-lg disabled:opacity-30"
                  onClick={() => writeCart(setCartQty(lines, line.slug, line.qty + 1))}
                  disabled={line.qty >= MAX_QTY}
                  aria-label="수량 늘리기"
                >
                  +
                </button>
              </div>
              <p className="font-medium tabular-nums" data-cart-line-total={line.price * line.qty}>
                {won(line.price * line.qty)}
              </p>
              <Button variant="outline" size="sm" onClick={() => writeCart(removeCartItem(lines, line.slug))}>
                빼기
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex items-end justify-between">
        <p className="text-sm text-muted-foreground">합계</p>
        <p className="text-2xl font-semibold tabular-nums" data-cart-total={total}>
          {won(total)}
        </p>
      </div>
      <a
        href={`/purchase?items=${encodeURIComponent(itemsQuery(lines))}`}
        data-cart-buy="purchase"
        className={cn(
          buttonVariants(),
          "h-12 w-full border-[#17364A] bg-[#17364A] px-4 text-white hover:bg-[#17364A]/90 sm:w-auto",
        )}
      >
        구매하기
      </a>
    </div>
  )
}
