"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { cartCount } from "@/components/store/cart-store"

export function CartButton() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const sync = () => setCount(cartCount())
    sync()
    window.addEventListener("storelab-cart", sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener("storelab-cart", sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  return (
    <Link href="/cart" className="inline-flex items-center gap-2">
      장바구니
      <span
        data-cart-count={count}
        className="min-w-6 rounded-full bg-primary px-1.5 py-0.5 text-center text-xs text-primary-foreground tabular-nums"
      >
        {count}
      </span>
    </Link>
  )
}
