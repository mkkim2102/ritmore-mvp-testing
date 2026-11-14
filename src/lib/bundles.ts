export const TIN_ENTRY_SLUG = "sample-a"

export type TinBundleSpec = {
  slug: string
  count: number
  name: string
  summary: string
  description: string
  category: string
}

export type TinChoice = {
  slug: string
  name: string
  price: number
  compareAt: number | null
  label: string
}

function bundleCopy(count: number) {
  return {
    name: `ritmore 카페인 민트 캔디 ${count}틴`,
    category: `${count}틴`,
    summary: `같은 슬라이드 틴 ${count}개입니다. 틴 하나에는 페퍼민트 12개가 들어 있습니다.`,
    description: `공부 책상, 야간 공부, 실습할 때 쓰는 카페인 민트 캔디입니다. 맛은 페퍼민트이고, 슬라이드 틴 하나에 12개가 들어 있습니다. 이 상품은 그 틴을 ${count}개 모은 구성입니다. 틴 크기는 55 × 67 × 9 mm입니다.`,
  }
}

export const TIN_BUNDLE_SPECS: TinBundleSpec[] = [3, 6].map((count) => ({
  slug: `sample-a-${count}`,
  count,
  ...bundleCopy(count),
}))

export const CUSTOMER_TIN_COUNTS = [1, 3, 6] as const

/** Pack totals shown and charged. List is 6,900 × count. Sale is 3,990, 3,800 × 3, and 3,650 × 6. */
export const CUSTOMER_TIN_PRICES = {
  1: { list: 6900, sale: 3990 },
  3: { list: 20700, sale: 11400 },
  6: { list: 41400, sale: 21900 },
} as const

export function customerTinLabel(count: number) {
  return `${count}개`
}

/** 틴 하나에 들어 있는 알 수. */
export const TABLETS_PER_TIN = 12

export function tabletCountLabel(tinCount: number) {
  const total = tinCount * TABLETS_PER_TIN
  return tinCount <= 1 ? `${total}정` : `총 ${total}정`
}

export function packChoiceLabel(tinCount: number) {
  return `${customerTinLabel(tinCount)} (${tabletCountLabel(tinCount)})`
}

/** The cart stores sample-a / sample-a-3 / sample-a-6. These are the public detail paths. */
const PUBLIC_SLUG_BY_INTERNAL = {
  "sample-a": "buy1",
  "sample-a-3": "buy2",
  "sample-a-6": "buy3",
} as const

const INTERNAL_SLUG_BY_PUBLIC: Record<string, string> = {
  buy1: "sample-a",
  buy2: "sample-a-3",
  buy3: "sample-a-6",
}

export function internalProductSlug(slug: string) {
  return Object.hasOwn(INTERNAL_SLUG_BY_PUBLIC, slug) ? INTERNAL_SLUG_BY_PUBLIC[slug] : slug
}

export function publicProductSlug(slug: string) {
  const internal = internalProductSlug(slug)
  if (Object.hasOwn(PUBLIC_SLUG_BY_INTERNAL, internal)) return PUBLIC_SLUG_BY_INTERNAL[internal as keyof typeof PUBLIC_SLUG_BY_INTERNAL]
  return slug
}

export function productPath(slug: string) {
  return `/products/${publicProductSlug(slug)}`
}

export function tinCountForSlug(slug: string) {
  const key = internalProductSlug(slug)
  return CUSTOMER_TIN_COUNTS.find((count) => tinSlugForCount(count) === key) ?? null
}

export function tinSlugForCount(count: number) {
  return count === 1 ? TIN_ENTRY_SLUG : `sample-a-${count}`
}

export function isTinBundle(slug: string) {
  const key = internalProductSlug(slug)
  return TIN_BUNDLE_SPECS.some((item) => item.slug === key)
}

export function isTinFamily(slug: string) {
  const key = internalProductSlug(slug)
  return key === TIN_ENTRY_SLUG || isTinBundle(key)
}

export function shelfProductName(name: string) {
  return name.replace(/\s+\d+(?:틴|개)$/, "").replace(/^ritmore\s+/, "")
}
