import {
  CUSTOMER_TIN_COUNTS,
  customerTinLabel,
  internalProductSlug,
  isCustomerTinSlug,
  isTinFamily,
  publicLandingPath,
  relatedTinSlugs,
  tinSlugForCount,
  type TinChoice,
} from "@/lib/bundles"
import { all, get, run } from "@/lib/db"
import { clampQty } from "@/lib/qty"
import type { Touch } from "@/lib/touch"
import type { Experiment, Offer, PricedLine, Product, TrackingLink, Variant } from "@/lib/types"

type ProductRow = {
  id: string
  slug: string
  name: string
  summary: string
  description: string
  category: string
  base_price: number
  compare_at_price: number | null
  status: string
  image_tone: string
}

type VariantRow = {
  id: string
  product_id: string
  experiment_id: string
  key: string
  label: string
  price: number
  compare_at_price: number | null
  active: number
}

type LinkRow = {
  id: string
  code: string
  name: string
  channel: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_content: string
  landing_path: string
  experiment_id: string | null
  variant_id: string | null
  product_id: string | null
  note: string
  price_override: number | null
  archived: number
}

type ExperimentRow = {
  id: string
  name: string
  hypothesis: string
  status: string
  product_id: string
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    summary: row.summary,
    description: row.description,
    category: row.category,
    basePrice: row.base_price,
    compareAtPrice: row.compare_at_price,
    status: row.status === "hidden" ? "hidden" : "active",
    imageTone: row.image_tone,
  }
}

function mapVariant(row: VariantRow): Variant {
  return {
    id: row.id,
    productId: row.product_id,
    experimentId: row.experiment_id,
    key: row.key,
    label: row.label,
    price: row.price,
    compareAtPrice: row.compare_at_price,
    active: row.active === 1,
  }
}

function mapLink(row: LinkRow): TrackingLink {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    channel: row.channel,
    utmSource: row.utm_source,
    utmMedium: row.utm_medium,
    utmCampaign: row.utm_campaign,
    utmContent: row.utm_content,
    landingPath: publicLandingPath(row.landing_path),
    experimentId: row.experiment_id,
    variantId: row.variant_id,
    productId: row.product_id,
    note: row.note,
    priceOverride: row.price_override,
    archived: row.archived === 1,
  }
}

export function getSetting(key: string) {
  return get<{ value: string }>("SELECT value FROM settings WHERE key = ?", [key])?.value ?? ""
}

export function setSetting(key: string, value: string) {
  run("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [
    key,
    value,
  ])
}

export function getBrand() {
  return {
    name: getSetting("brand_name") || "브랜드명",
    tagline: getSetting("brand_tagline") || "한 줄 소개가 들어갑니다.",
  }
}

export function listProducts(includeHidden = false) {
  const rows = all<ProductRow>(
    includeHidden
      ? "SELECT * FROM products ORDER BY created_at ASC"
      : "SELECT * FROM products WHERE status = 'active' ORDER BY created_at ASC",
  )
  const products = rows.map(mapProduct)
  if (includeHidden) return products
  return products.filter((product) => !isTinFamily(product.slug) || isCustomerTinSlug(product.slug))
}

export function getProductBySlug(slug: string) {
  const row = get<ProductRow>("SELECT * FROM products WHERE slug = ?", [internalProductSlug(slug)])
  return row ? mapProduct(row) : null
}

export function getProductById(id: string) {
  const row = get<ProductRow>("SELECT * FROM products WHERE id = ?", [id])
  return row ? mapProduct(row) : null
}

export function listVariants() {
  return all<VariantRow>("SELECT * FROM variants ORDER BY key ASC").map(mapVariant)
}

export function getVariant(id: string) {
  const row = get<VariantRow>("SELECT * FROM variants WHERE id = ?", [id])
  return row ? mapVariant(row) : null
}

export function listExperiments() {
  return all<ExperimentRow>("SELECT * FROM experiments ORDER BY created_at DESC").map(
    (row): Experiment => ({
      id: row.id,
      name: row.name,
      hypothesis: row.hypothesis,
      status: row.status,
      productId: row.product_id,
    }),
  )
}

export function listLinks() {
  return all<LinkRow>("SELECT * FROM links ORDER BY created_at DESC").map(mapLink)
}

export function getLinkByCode(code: string) {
  const row = get<LinkRow>("SELECT * FROM links WHERE code = ?", [code])
  return row ? mapLink(row) : null
}

export function resolveOffer(product: Product, touch: Touch): Offer {
  const compareAtPrice = product.compareAtPrice
  if (touch.linkCode) {
    const link = getLinkByCode(touch.linkCode)
    if (link && !link.archived) {
      if (link.priceOverride != null && (!link.productId || link.productId === product.id)) {
        return {
          price: link.priceOverride,
          compareAtPrice,
          variantId: null,
          experimentId: null,
          variantLabel: null,
        }
      }
      if (link.variantId) {
        const variant = getVariant(link.variantId)
        if (variant && variant.active && variant.productId === product.id) {
          return {
            price: variant.price,
            compareAtPrice,
            variantId: variant.id,
            experimentId: variant.experimentId,
            variantLabel: variant.label,
          }
        }
      }
    }
  }
  return {
    price: product.basePrice,
    compareAtPrice,
    variantId: null,
    experimentId: null,
    variantLabel: null,
  }
}

export function parseItems(raw: string | null | undefined) {
  if (!raw) return []
  const items: { slug: string; qty: number }[] = []
  for (const part of raw.split(",")) {
    const [slug, qtyText] = part.split(":")
    if (!slug || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(slug)) continue
    const qty = clampQty(Number(qtyText) || 1)
    items.push({ slug, qty })
  }
  return items.slice(0, 12)
}

export function listRelated(product: Product, touch: Touch) {
  const family = relatedTinSlugs(product.slug)
  const products = family
    ? family
        .map((slug) => getProductBySlug(slug))
        .filter((item): item is Product => !!item && item.status === "active")
    : listProducts().filter((item) => item.slug !== product.slug)
  return products.map((item) => ({ product: item, offer: resolveOffer(item, touch) }))
}

export function tinPurchaseOptions(touch: Touch): TinChoice[] {
  const choices: TinChoice[] = []
  for (const count of CUSTOMER_TIN_COUNTS) {
    const slug = tinSlugForCount(count)
    const product = getProductBySlug(slug)
    if (!product || product.status !== "active") continue
    const offer = resolveOffer(product, touch)
    choices.push({
      slug: product.slug,
      name: product.name,
      price: offer.price,
      compareAt: offer.compareAtPrice,
      label: customerTinLabel(count),
    })
  }
  return choices
}

export function priceLines(items: { slug: string; qty: number }[], touch: Touch): PricedLine[] {
  const lines: PricedLine[] = []
  for (const item of items) {
    const product = getProductBySlug(item.slug)
    if (!product || product.status !== "active") continue
    lines.push({ product, qty: item.qty, offer: resolveOffer(product, touch) })
  }
  return lines
}

export function linkHref(origin: string, link: TrackingLink, preview = false) {
  const url = new URL(publicLandingPath(link.landingPath || "/"), origin)
  url.searchParams.set("link", link.code)
  if (link.utmSource) url.searchParams.set("utm_source", link.utmSource)
  if (link.utmMedium) url.searchParams.set("utm_medium", link.utmMedium)
  if (link.utmCampaign) url.searchParams.set("utm_campaign", link.utmCampaign)
  if (link.utmContent) url.searchParams.set("utm_content", link.utmContent)
  if (preview) url.searchParams.set("preview", "1")
  return url.toString()
}
