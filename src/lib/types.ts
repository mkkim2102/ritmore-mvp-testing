export type Product = {
  id: string
  slug: string
  name: string
  summary: string
  description: string
  category: string
  basePrice: number
  compareAtPrice: number | null
  status: "active" | "hidden"
  imageTone: string
}

export type Experiment = {
  id: string
  name: string
  hypothesis: string
  status: string
  productId: string
}

export type Variant = {
  id: string
  productId: string
  experimentId: string
  key: string
  label: string
  price: number
  compareAtPrice: number | null
  active: boolean
}

export type TrackingLink = {
  id: string
  code: string
  name: string
  channel: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  utmContent: string
  landingPath: string
  experimentId: string | null
  variantId: string | null
  productId: string | null
  note: string
  priceOverride: number | null
  archived: boolean
}

export type Offer = {
  price: number
  compareAtPrice: number | null
  variantId: string | null
  experimentId: string | null
  variantLabel: string | null
}

export type PricedLine = {
  product: Product
  qty: number
  offer: Offer
}

export const TONES: Record<string, string> = {
  sand: "bg-[#e7d7c8]",
  sage: "bg-[#d5e0d8]",
  clay: "bg-[#e5d2cc]",
  mist: "bg-[#d7dde6]",
}
