"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  itemsQuery,
  readCart,
  removeCartItem,
  setCartQty,
  writeCart,
  type CartItem,
} from "@/components/store/cart-store"
import { won } from "@/lib/format"
import { MAX_QTY, clampQty } from "@/lib/qty"
import { cn } from "@/lib/utils"

type QuoteLine = {
  slug: string
  name: string
  qty: number
  price: number
  compareAtPrice: number | null
}

type Snapshot = {
  items: CartItem[]
  lines: QuoteLine[]
}

function isAbort(reason: unknown) {
  if (!reason || typeof reason !== "object") return false
  return "name" in reason && reason.name === "AbortError"
}

function rememberBuys(lines: QuoteLine[]) {
  for (const line of lines) {
    void fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        step: "buy_click",
        path: window.location.pathname,
        productSlug: line.slug,
        qty: line.qty,
      }),
    }).catch(() => undefined)
  }
}

export function CartView() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [error, setError] = useState("")
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const stored = readCart()

    if (stored.length === 0) {
      const frame = window.requestAnimationFrame(() => {
        if (!active) return
        setError("")
        setSnapshot({ items: [], lines: [] })
      })
      return () => {
        active = false
        controller.abort()
        window.cancelAnimationFrame(frame)
      }
    }

    fetch(`/api/quote?items=${encodeURIComponent(itemsQuery(stored))}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("가격을 읽지 못했습니다.")
        return (await response.json()) as { lines: QuoteLine[] }
      })
      .then((body) => {
        if (!active) return
        const latest = readCart()
        if (latest.length === 0) {
          setError("")
          setSnapshot({ items: [], lines: [] })
          return
        }
        const qtyBySlug = new Map(latest.map((item) => [item.slug, item.qty]))
        const lines = body.lines
          .filter((line) => qtyBySlug.has(line.slug))
          .map((line) => ({ ...line, qty: qtyBySlug.get(line.slug) ?? line.qty }))
        if (lines.length === 0) {
          setError("가격을 불러오지 못했습니다. 새로고침해 주세요.")
          return
        }
        setError("")
        setSnapshot({ items: latest, lines })
      })
      .catch((reason: unknown) => {
        if (!active || isAbort(reason)) return
        setError("가격을 불러오지 못했습니다. 새로고침해 주세요.")
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [version])

  function changeQty(slug: string, qty: number) {
    if (!snapshot) return
    const nextQty = clampQty(qty)
    const items = setCartQty(snapshot.items, slug, nextQty)
    writeCart(items)
    setSnapshot({
      items,
      lines: snapshot.lines.map((line) => (line.slug === slug ? { ...line, qty: nextQty } : line)),
    })
  }

  function remove(slug: string) {
    if (!snapshot) return
    const items = removeCartItem(snapshot.items, slug)
    writeCart(items)
    const lines = snapshot.lines.filter((line) => line.slug !== slug)
    setError("")
    setSnapshot({ items, lines })
    if (items.length > 0 && lines.length === 0) setVersion((value) => value + 1)
  }

  if (snapshot === null && error) return <p className="text-sm text-destructive">{error}</p>

  if (snapshot === null) {
    return <p className="text-sm text-muted-foreground">장바구니를 불러오는 중입니다.</p>
  }

  if (snapshot.items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
        <p className="font-serif text-2xl">장바구니가 비어 있습니다</p>
        <p className="mt-2 text-sm text-muted-foreground">상품 페이지에서 담으면 가격이 여기에 나옵니다.</p>
        <Button className="mt-6 h-11" render={<Link href="/products/sample-a" />}>
          제품 보기
        </Button>
      </div>
    )
  }

  if (snapshot.lines.length === 0) {
    return <p className="text-sm text-destructive">{error || "가격을 불러오지 못했습니다. 새로고침해 주세요."}</p>
  }

  const total = snapshot.lines.reduce((sum, line) => sum + line.price * line.qty, 0)

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {snapshot.lines.map((line) => (
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
                  onClick={() => changeQty(line.slug, line.qty - 1)}
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
                  onClick={() => changeQty(line.slug, line.qty + 1)}
                  disabled={line.qty >= MAX_QTY}
                  aria-label="수량 늘리기"
                >
                  +
                </button>
              </div>
              <p className="font-medium tabular-nums" data-cart-line-total={line.price * line.qty}>
                {won(line.price * line.qty)}
              </p>
              <Button variant="outline" size="sm" onClick={() => remove(line.slug)}>
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
        href={`/project?items=${itemsQuery(snapshot.lines)}`}
        data-cart-buy="project"
        className={cn(buttonVariants(), "h-12 w-full px-4 sm:w-auto")}
        onClick={() => rememberBuys(snapshot.lines)}
      >
        구매하기
      </a>
    </div>
  )
}
