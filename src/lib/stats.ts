import { all } from "@/lib/db"
import { FUNNEL_STEPS, type Step } from "@/lib/funnel"
import { rangeStart } from "@/lib/format"

export type StatsFilters = {
  range: string
  link: string
  channel: string
  includePreview: boolean
}

type Where = { sql: string; params: (string | number)[] }

function whereOf(filters: StatsFilters): Where {
  const clauses = ["1 = 1"]
  const params: (string | number)[] = []
  if (!filters.includePreview) clauses.push("preview = 0")
  const from = rangeStart(filters.range)
  if (from) {
    clauses.push("created_at >= ?")
    params.push(from)
  }
  if (filters.link) {
    clauses.push("ifnull(link_code, '') = ?")
    params.push(filters.link)
  }
  if (filters.channel) {
    clauses.push("channel = ?")
    params.push(filters.channel)
  }
  return { sql: clauses.join(" AND "), params }
}

export function funnelCounts(filters: StatsFilters) {
  const where = whereOf(filters)
  const rows = all<{ step: Step; sessions: number }>(
    `SELECT step, COUNT(DISTINCT session_id) AS sessions
     FROM events
     WHERE ${where.sql}
     GROUP BY step`,
    where.params,
  )
  const byStep = new Map(rows.map((row) => [row.step, row.sessions]))
  return FUNNEL_STEPS.map((step) => ({ step, sessions: byStep.get(step) ?? 0 }))
}

export function sideCounts(filters: StatsFilters) {
  const where = whereOf(filters)
  const row = all<{ add_to_cart: number; cart_view: number }>(
    `SELECT
       COUNT(DISTINCT CASE WHEN step = 'add_to_cart' THEN session_id END) AS add_to_cart,
       COUNT(DISTINCT CASE WHEN step = 'cart_view' THEN session_id END) AS cart_view
     FROM events
     WHERE ${where.sql}`,
    where.params,
  )
  return { addToCart: row[0]?.add_to_cart ?? 0, cartViews: row[0]?.cart_view ?? 0 }
}

export type LinkStat = {
  linkCode: string
  channel: string
  visits: number
  productViews: number
  buyClicks: number
  checkoutViews: number
  payClicks: number
}

export type SourceStat = {
  linkCode: string
  referrerClass: string
  visits: number
  productViews: number
  buyClicks: number
  checkoutViews: number
  payClicks: number
}

export function sourceStats(filters: StatsFilters) {
  const where = whereOf(filters)
  return all<{
    link_code: string
    referrer_class: string
    visits: number
    product_views: number
    buy_clicks: number
    checkout_views: number
    pay_clicks: number
  }>(
    `SELECT
       ifnull(link_code, '') AS link_code,
       ifnull(referrer_class, 'direct') AS referrer_class,
       COUNT(DISTINCT CASE WHEN step = 'visit' THEN session_id END) AS visits,
       COUNT(DISTINCT CASE WHEN step = 'product_view' THEN session_id END) AS product_views,
       COUNT(DISTINCT CASE WHEN step = 'buy_click' THEN session_id END) AS buy_clicks,
       COUNT(DISTINCT CASE WHEN step = 'checkout_view' THEN session_id END) AS checkout_views,
       COUNT(DISTINCT CASE WHEN step = 'pay_click' THEN session_id END) AS pay_clicks
     FROM events
     WHERE ${where.sql}
     GROUP BY ifnull(link_code, ''), ifnull(referrer_class, 'direct')
     HAVING visits > 0 OR product_views > 0 OR buy_clicks > 0 OR checkout_views > 0 OR pay_clicks > 0
     ORDER BY visits DESC, link_code ASC, referrer_class ASC`,
    where.params,
  ).map(
    (row): SourceStat => ({
      linkCode: row.link_code,
      referrerClass: row.referrer_class || "direct",
      visits: row.visits,
      productViews: row.product_views,
      buyClicks: row.buy_clicks,
      checkoutViews: row.checkout_views,
      payClicks: row.pay_clicks,
    }),
  )
}

export function linkStats(filters: StatsFilters) {
  const where = whereOf(filters)
  return all<{
    link_code: string | null
    channel: string
    visits: number
    product_views: number
    buy_clicks: number
    checkout_views: number
    pay_clicks: number
  }>(
    `SELECT
       link_code,
       MAX(channel) AS channel,
       COUNT(DISTINCT CASE WHEN step = 'visit' THEN session_id END) AS visits,
       COUNT(DISTINCT CASE WHEN step = 'product_view' THEN session_id END) AS product_views,
       COUNT(DISTINCT CASE WHEN step = 'buy_click' THEN session_id END) AS buy_clicks,
       COUNT(DISTINCT CASE WHEN step = 'checkout_view' THEN session_id END) AS checkout_views,
       COUNT(DISTINCT CASE WHEN step = 'pay_click' THEN session_id END) AS pay_clicks
     FROM events
     WHERE ${where.sql}
     GROUP BY ifnull(link_code, '')
     ORDER BY visits DESC`,
    where.params,
  ).map(
    (row): LinkStat => ({
      linkCode: row.link_code || "",
      channel: row.channel,
      visits: row.visits,
      productViews: row.product_views,
      buyClicks: row.buy_clicks,
      checkoutViews: row.checkout_views,
      payClicks: row.pay_clicks,
    }),
  )
}

export type VariantStat = {
  variantId: string
  productId: string
  price: number | null
  productViews: number
  buyClicks: number
  payClicks: number
}

export function variantStats(filters: StatsFilters) {
  const where = whereOf(filters)
  return all<{
    variant_id: string | null
    product_id: string
    price: number | null
    product_views: number
    buy_clicks: number
    pay_clicks: number
  }>(
    `SELECT
       variant_id,
       product_id,
       MAX(price) AS price,
       COUNT(DISTINCT CASE WHEN step = 'product_view' THEN session_id END) AS product_views,
       COUNT(DISTINCT CASE WHEN step = 'buy_click' THEN session_id END) AS buy_clicks,
       COUNT(DISTINCT CASE WHEN step = 'pay_click' THEN session_id END) AS pay_clicks
     FROM events
     WHERE ${where.sql} AND product_id IS NOT NULL
     GROUP BY ifnull(variant_id, ''), product_id
     ORDER BY product_views DESC`,
    where.params,
  ).map(
    (row): VariantStat => ({
      variantId: row.variant_id || "",
      productId: row.product_id,
      price: row.price,
      productViews: row.product_views,
      buyClicks: row.buy_clicks,
      payClicks: row.pay_clicks,
    }),
  )
}

export type EventRow = {
  id: string
  createdAt: string
  visitorId: string
  sessionId: string
  step: Step
  path: string
  linkCode: string
  channel: string
  source: string
  medium: string
  campaign: string
  content: string
  referrer: string
  referrerClass: string
  experimentId: string
  productId: string
  variantId: string
  price: number | null
  qty: number | null
  preview: boolean
  meta: string
}

export function recentEvents(filters: StatsFilters) {
  const where = whereOf(filters)
  return all<{
    id: string
    created_at: string
    visitor_id: string
    session_id: string
    step: Step
    path: string
    link_code: string | null
    channel: string
    source: string | null
    medium: string | null
    campaign: string | null
    content: string | null
    referrer: string | null
    referrer_class: string | null
    experiment_id: string | null
    product_id: string | null
    variant_id: string | null
    price: number | null
    qty: number | null
    preview: number
    meta: string | null
  }>(
    `SELECT id, created_at, visitor_id, session_id, step, path, link_code, channel, source, medium, campaign, content,
            referrer, referrer_class, experiment_id, product_id, variant_id, price, qty, preview, meta
     FROM events
     WHERE ${where.sql}
     ORDER BY created_at DESC
     LIMIT 80`,
    where.params,
  ).map(
    (row): EventRow => ({
      id: row.id,
      createdAt: row.created_at,
      visitorId: row.visitor_id,
      sessionId: row.session_id,
      step: row.step,
      path: row.path,
      linkCode: row.link_code || "",
      channel: row.channel,
      source: row.source || "",
      medium: row.medium || "",
      campaign: row.campaign || "",
      content: row.content || "",
      referrer: row.referrer || "",
      referrerClass: row.referrer_class || "direct",
      experimentId: row.experiment_id || "",
      productId: row.product_id || "",
      variantId: row.variant_id || "",
      price: row.price,
      qty: row.qty,
      preview: row.preview === 1,
      meta: row.meta || "",
    }),
  )
}

export function readFilters(search: {
  range?: string
  link?: string
  channel?: string
  preview?: string
}): StatsFilters {
  const range = search.range === "today" || search.range === "30d" || search.range === "all" ? search.range : "7d"
  return {
    range,
    link: search.link || "",
    channel: search.channel || "",
    includePreview: search.preview === "1",
  }
}
