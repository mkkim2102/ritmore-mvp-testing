import { clampQty } from "@/lib/qty"

export type CartItem = { slug: string; qty: number }

const KEY = "storelab-cart"

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]") as unknown
    if (!Array.isArray(raw)) return []
    return raw.flatMap((item) => {
      if (!item || typeof item !== "object") return []
      const slug = "slug" in item ? String(item.slug) : ""
      const qty = "qty" in item ? Number(item.qty) : 1
      if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(slug)) return []
      return [{ slug, qty: clampQty(qty || 1) }]
    })
  } catch {
    return []
  }
}

export function writeCart(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items))
  window.dispatchEvent(new Event("storelab-cart"))
}

export function addCartQty(items: CartItem[], slug: string, qty: number) {
  const adding = clampQty(qty)
  const index = items.findIndex((item) => item.slug === slug)
  if (index < 0) return [...items, { slug, qty: adding }]
  return items.map((item, itemIndex) =>
    itemIndex === index ? { slug, qty: clampQty(item.qty + adding) } : item,
  )
}

export function setCartQty(items: CartItem[], slug: string, qty: number) {
  const nextQty = clampQty(qty)
  return items.map((item) => (item.slug === slug ? { slug, qty: nextQty } : item))
}

export function removeCartItem(items: CartItem[], slug: string) {
  return items.filter((item) => item.slug !== slug)
}

export function cartCount(items = readCart()) {
  return items.reduce((sum, item) => sum + item.qty, 0)
}

export function itemsQuery(items: CartItem[]) {
  return items.map((item) => `${item.slug}:${item.qty}`).join(",")
}
