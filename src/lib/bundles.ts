export const TIN_ENTRY_SLUG = "sample-a"

export type TinBundleSpec = {
  slug: string
  count: number
  name: string
  summary: string
  description: string
  category: string
}

export type TinFamilyItem = {
  slug: string
  count: number
  entry: boolean
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

export const TIN_BUNDLE_SPECS: TinBundleSpec[] = [3, 6, 12].map((count) => ({
  slug: `sample-a-${count}`,
  count,
  ...bundleCopy(count),
}))

export const TIN_FAMILY: TinFamilyItem[] = [
  { slug: TIN_ENTRY_SLUG, count: 1, entry: true },
  ...TIN_BUNDLE_SPECS.map((item) => ({ slug: item.slug, count: item.count, entry: false })),
]

export const CUSTOMER_TIN_COUNTS = [1, 3, 6] as const

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

export function tinCountForSlug(slug: string) {
  return CUSTOMER_TIN_COUNTS.find((count) => tinSlugForCount(count) === slug) ?? null
}

export function bundleProductId(slug: string) {
  return `prod_${slug.replaceAll("-", "_")}`
}

export function tinSlugForCount(count: number) {
  return count === 1 ? TIN_ENTRY_SLUG : `sample-a-${count}`
}

export function isTinBundle(slug: string) {
  return TIN_BUNDLE_SPECS.some((item) => item.slug === slug)
}

export function isTinFamily(slug: string) {
  return slug === TIN_ENTRY_SLUG || isTinBundle(slug)
}

export function isCustomerTinSlug(slug: string) {
  return CUSTOMER_TIN_COUNTS.some((count) => tinSlugForCount(count) === slug)
}

export function customerFacingTinName(name: string, slug: string) {
  const count = CUSTOMER_TIN_COUNTS.find((item) => tinSlugForCount(item) === slug)
  if (count == null) return name
  return `${name.replace(/\s+\d+틴$/, "")} ${customerTinLabel(count)}`
}

export function shelfProductName(name: string) {
  return name.replace(/\s+\d+(?:틴|개)$/, "").replace(/^ritmore\s+/, "")
}

export function relatedTinSlugs(slug: string) {
  if (!isTinFamily(slug)) return null
  return TIN_FAMILY.filter((item) => item.slug !== slug && isCustomerTinSlug(item.slug)).map((item) => item.slug)
}
