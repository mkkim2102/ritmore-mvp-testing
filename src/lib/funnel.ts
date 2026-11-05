export const STEPS = [
  "visit",
  "catalog_view",
  "product_view",
  "buy_open",
  "add_to_cart",
  "cart_view",
  "buy_click",
  "checkout_view",
  "pay_click",
  "review_click",
  "dwell",
  "return",
] as const

export type Step = (typeof STEPS)[number]

export const FUNNEL_STEPS = [
  "visit",
  "catalog_view",
  "product_view",
  "buy_open",
  "buy_click",
  "cart_view",
  "checkout_view",
  "pay_click",
] as const satisfies readonly Step[]

export const STEP_LABEL: Record<Step, string> = {
  visit: "방문",
  catalog_view: "상품 목록",
  product_view: "상품 상세",
  buy_open: "첫 구매하기",
  add_to_cart: "장바구니 담기",
  cart_view: "장바구니 입장",
  buy_click: "구매 확정",
  checkout_view: "결제 페이지",
  pay_click: "결제 버튼",
  review_click: "후기 클릭",
  dwell: "체류",
  return: "다시 방문",
}

const REPEAT_STEPS = new Set<Step>(["buy_open", "buy_click", "add_to_cart", "review_click", "dwell"])

export function dedupeKey(step: Step, productId: string | null, nonce?: string) {
  if (step === "visit" || step === "catalog_view" || step === "return") return step
  if (nonce && REPEAT_STEPS.has(step)) return `${step}:${productId ?? "-"}:${nonce}`
  return `${step}:${productId ?? "-"}`
}

export function repeatsPerSession(step: Step) {
  return REPEAT_STEPS.has(step)
}
