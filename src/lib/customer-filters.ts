import { won } from "@/lib/format"
import { STEP_LABEL } from "@/lib/funnel"
import type { VisitorRollup } from "@/lib/journey"

export type CustomerActionFilter = {
  id: string
  label: string
  match: (row: VisitorRollup) => boolean
}

export const CUSTOMER_ACTION_FILTERS: CustomerActionFilter[] = [
  { id: "visit", label: STEP_LABEL.visit, match: (row) => row.visited },
  { id: "product_view", label: STEP_LABEL.product_view, match: (row) => row.productView },
  { id: "buy_open", label: STEP_LABEL.buy_open, match: (row) => row.buyOpens > 0 },
  { id: "add_to_cart", label: STEP_LABEL.add_to_cart, match: (row) => row.addedCart },
  { id: "cart_view", label: STEP_LABEL.cart_view, match: (row) => row.viewedCart },
  { id: "buy_click", label: STEP_LABEL.buy_click, match: (row) => row.buyClicks > 0 },
  { id: "checkout_view", label: STEP_LABEL.checkout_view, match: (row) => row.checkoutView },
  { id: "pay_click", label: STEP_LABEL.pay_click, match: (row) => row.payClick },
  { id: "review_click", label: STEP_LABEL.review_click, match: (row) => row.reviewClick },
  { id: "return", label: STEP_LABEL.return, match: (row) => row.returned },
]

export type CustomerListQuery = {
  action: string
  option: string
  route: string
}

export function filterCustomerRollups(
  rows: VisitorRollup[],
  query: CustomerListQuery,
  buyersByProduct: Map<string, Set<string>>,
) {
  const action = CUSTOMER_ACTION_FILTERS.find((item) => item.id === query.action) ?? null
  return rows.filter((row) => {
    if (action && !action.match(row)) return false
    if (query.option && !buyersByProduct.get(query.option)?.has(row.id)) return false
    if (query.route && row.sourceKey !== query.route) return false
    return true
  })
}

export function indexConfirmedBuys(
  buys: { visitor_id: string; product_id: string; qty: number; amount: number }[],
  labelFor: (productId: string) => string,
) {
  const lines = new Map<string, string[]>()
  const buyersByProduct = new Map<string, Set<string>>()
  for (const buy of buys) {
    const line = `${labelFor(buy.product_id)} ${buy.qty}개 ${won(buy.amount)}`
    const list = lines.get(buy.visitor_id) ?? []
    list.push(line)
    lines.set(buy.visitor_id, list)
    const buyers = buyersByProduct.get(buy.product_id) ?? new Set<string>()
    buyers.add(buy.visitor_id)
    buyersByProduct.set(buy.product_id, buyers)
  }
  return { lines, buyersByProduct }
}
