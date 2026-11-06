import { customerFacingTinName } from "@/lib/bundles"
import { listLinks, listProducts } from "@/lib/catalog"
import type { Product } from "@/lib/types"
import { all } from "@/lib/db"
import { formatDuration, won } from "@/lib/format"
import { STEP_LABEL, type Step } from "@/lib/funnel"
import { referrerLabel } from "@/lib/referrer"

export type VisitorRollup = {
  id: string
  sourceKey: string
  linkCode: string
  referrerClass: string
  firstSeen: string
  lastSeen: string
  dwellSeconds: number
  buyOpens: number
  buyClicks: number
  addedCart: boolean
  viewedCart: boolean
  reviewClick: boolean
  returned: boolean
  visited: boolean
  productView: boolean
  checkoutView: boolean
  payClick: boolean
  lastQty: number | null
  buyAmount: number
  payAmount: number
}

export type FunnelTotals = {
  visitors: number
  visits: number
  productViews: number
  buyOpens: number
  buyOpeners: number
  buyClicks: number
  buyers: number
  addToCart: number
  cartViews: number
  checkoutViews: number
  payClicks: number
  reviewClicks: number
  dwellSeconds: number
  dwellVisitors: number
  quantityVisitors: number
  quantityAverage: number | null
  returned: number
  buyAmount: number
  payAmount: number
}

export type SourceFunnel = FunnelTotals & {
  sourceKey: string
  label: string
  code: string
}

type RollupRow = {
  visitor_id: string
  link_code: string | null
  referrer_class: string | null
  first_seen: string
  last_seen: string
  dwell_seconds: number | null
  buy_opens: number | null
  buy_clicks: number | null
  added_cart: number | null
  viewed_cart: number | null
  review_click: number | null
  returned: number | null
  visited: number | null
  product_view: number | null
  checkout_view: number | null
  pay_click: number | null
  last_qty: number | null
  buy_amount: number | null
  pay_amount: number | null
}

export type EventWindow = {
  fromIso?: string | null
  untilIso?: string | null
}

export type WindowEvent = {
  createdAt: string
  visitorId: string
  step: string
  path: string
  linkCode: string
  referrerClass: string
  qty: number | null
  price: number | null
}

const DWELL_PAGE: Record<string, string> = {
  home: "홈",
  product: "상품",
  cart: "장바구니",
  checkout: "결제",
}

export function sourceKeyOf(linkCode: string | null | undefined, referrerClass: string | null | undefined) {
  if (linkCode) return `link:${linkCode}`
  return `ref:${referrerClass || "direct"}`
}

export function sourceLabel(key: string, names: Map<string, string>) {
  if (key.startsWith("link:")) {
    const code = key.slice(5)
    return names.get(code) || code
  }
  return referrerLabel(key.slice(4))
}

export function linkNames() {
  const names = new Map<string, string>()
  for (const link of listLinks()) names.set(link.code, link.name)
  return names
}

function eventWindow(window?: EventWindow) {
  const clauses = ["preview = 0"]
  const params: string[] = []
  if (window?.fromIso) {
    clauses.push("created_at >= ?")
    params.push(window.fromIso)
  }
  if (window?.untilIso) {
    clauses.push("created_at < ?")
    params.push(window.untilIso)
  }
  return { where: clauses.join(" AND "), params }
}

export function listVisitorRollups(window?: EventWindow) {
  const { where, params } = eventWindow(window)
  const rows = all<RollupRow>(`
    WITH real AS (
      SELECT * FROM events WHERE ${where}
    ),
    first_touch AS (
      SELECT visitor_id, link_code, referrer_class
      FROM (
        SELECT
          visitor_id,
          link_code,
          referrer_class,
          ROW_NUMBER() OVER (PARTITION BY visitor_id ORDER BY created_at ASC, id ASC) AS rn
        FROM real
      )
      WHERE rn = 1
    ),
    last_qty AS (
      SELECT visitor_id, qty
      FROM (
        SELECT
          visitor_id,
          qty,
          ROW_NUMBER() OVER (PARTITION BY visitor_id ORDER BY created_at DESC, id DESC) AS rn
        FROM real
        WHERE qty IS NOT NULL AND step IN ('buy_click', 'add_to_cart')
      )
      WHERE rn = 1
    ),
    agg AS (
      SELECT
        visitor_id,
        MIN(created_at) AS first_seen,
        MAX(created_at) AS last_seen,
        SUM(CASE WHEN step = 'dwell' THEN COALESCE(json_extract(meta, '$.seconds'), 0) ELSE 0 END) AS dwell_seconds,
        SUM(CASE WHEN step = 'buy_open' THEN 1 ELSE 0 END) AS buy_opens,
        SUM(CASE WHEN step = 'buy_click' THEN 1 ELSE 0 END) AS buy_clicks,
        MAX(CASE WHEN step = 'add_to_cart' THEN 1 ELSE 0 END) AS added_cart,
        MAX(CASE WHEN step = 'cart_view' THEN 1 ELSE 0 END) AS viewed_cart,
        MAX(CASE WHEN step = 'review_click' THEN 1 ELSE 0 END) AS review_click,
        MAX(CASE WHEN step = 'return' THEN 1 ELSE 0 END) AS returned,
        MAX(CASE WHEN step = 'visit' THEN 1 ELSE 0 END) AS visited,
        MAX(CASE WHEN step = 'product_view' THEN 1 ELSE 0 END) AS product_view,
        MAX(CASE WHEN step = 'checkout_view' THEN 1 ELSE 0 END) AS checkout_view,
        MAX(CASE WHEN step = 'pay_click' THEN 1 ELSE 0 END) AS pay_click,
        SUM(CASE WHEN step = 'buy_click' AND price IS NOT NULL THEN price * CASE WHEN qty IS NULL THEN 1 ELSE qty END ELSE 0 END) AS buy_amount,
        SUM(CASE WHEN step = 'pay_click' AND price IS NOT NULL THEN price * CASE WHEN qty IS NULL THEN 1 ELSE qty END ELSE 0 END) AS pay_amount
      FROM real
      GROUP BY visitor_id
    )
    SELECT
      agg.visitor_id,
      first_touch.link_code,
      first_touch.referrer_class,
      agg.first_seen,
      agg.last_seen,
      agg.dwell_seconds,
      agg.buy_opens,
      agg.buy_clicks,
      agg.added_cart,
      agg.viewed_cart,
      agg.review_click,
      agg.returned,
      agg.visited,
      agg.product_view,
      agg.checkout_view,
      agg.pay_click,
      last_qty.qty AS last_qty,
      agg.buy_amount,
      agg.pay_amount
    FROM agg
    LEFT JOIN first_touch ON first_touch.visitor_id = agg.visitor_id
    LEFT JOIN last_qty ON last_qty.visitor_id = agg.visitor_id
    ORDER BY agg.last_seen DESC, agg.visitor_id ASC
  `, params)

  return rows.map((row): VisitorRollup => {
    const linkCode = row.link_code || ""
    const referrerClass = row.referrer_class || "direct"
    return {
      id: row.visitor_id,
      sourceKey: sourceKeyOf(linkCode, referrerClass),
      linkCode,
      referrerClass,
      firstSeen: row.first_seen,
      lastSeen: row.last_seen,
      dwellSeconds: Number(row.dwell_seconds) || 0,
      buyOpens: Number(row.buy_opens) || 0,
      buyClicks: Number(row.buy_clicks) || 0,
      addedCart: row.added_cart === 1,
      viewedCart: row.viewed_cart === 1,
      reviewClick: row.review_click === 1,
      returned: row.returned === 1,
      visited: row.visited === 1,
      productView: row.product_view === 1,
      checkoutView: row.checkout_view === 1,
      payClick: row.pay_click === 1,
      lastQty: row.last_qty == null ? null : Number(row.last_qty),
      buyAmount: Number(row.buy_amount) || 0,
      payAmount: Number(row.pay_amount) || 0,
    }
  })
}

export function listWindowEvents(window?: EventWindow) {
  const { where, params } = eventWindow(window)
  return all<{
    created_at: string
    visitor_id: string
    step: string
    path: string
    link_code: string | null
    referrer_class: string | null
    qty: number | null
    price: number | null
  }>(
    `SELECT created_at, visitor_id, step, path, link_code, referrer_class, qty, price
     FROM events
     WHERE ${where}
     ORDER BY created_at ASC, id ASC`,
    params,
  ).map((row): WindowEvent => ({
    createdAt: row.created_at,
    visitorId: row.visitor_id,
    step: row.step,
    path: row.path,
    linkCode: row.link_code || "",
    referrerClass: row.referrer_class || "direct",
    qty: row.qty == null ? null : Number(row.qty),
    price: row.price == null ? null : Number(row.price),
  }))
}

export function emptyTotals(): FunnelTotals {
  return {
    visitors: 0,
    visits: 0,
    productViews: 0,
    buyOpens: 0,
    buyOpeners: 0,
    buyClicks: 0,
    buyers: 0,
    addToCart: 0,
    cartViews: 0,
    checkoutViews: 0,
    payClicks: 0,
    reviewClicks: 0,
    dwellSeconds: 0,
    dwellVisitors: 0,
    quantityVisitors: 0,
    quantityAverage: null,
    returned: 0,
    buyAmount: 0,
    payAmount: 0,
  }
}

export function summarize(rows: VisitorRollup[]): FunnelTotals {
  const totals = emptyTotals()
  let quantitySum = 0
  for (const row of rows) {
    totals.visitors += 1
    if (row.visited) totals.visits += 1
    if (row.productView) totals.productViews += 1
    totals.buyOpens += row.buyOpens
    if (row.buyOpens > 0) totals.buyOpeners += 1
    totals.buyClicks += row.buyClicks
    if (row.buyClicks > 0) totals.buyers += 1
    if (row.addedCart) totals.addToCart += 1
    if (row.viewedCart) totals.cartViews += 1
    if (row.checkoutView) totals.checkoutViews += 1
    if (row.payClick) totals.payClicks += 1
    if (row.reviewClick) totals.reviewClicks += 1
    totals.dwellSeconds += row.dwellSeconds
    if (row.dwellSeconds > 0) totals.dwellVisitors += 1
    if (row.lastQty != null) {
      totals.quantityVisitors += 1
      quantitySum += row.lastQty
    }
    if (row.returned) totals.returned += 1
    totals.buyAmount += row.buyAmount
    totals.payAmount += row.payAmount
  }
  totals.quantityAverage = totals.quantityVisitors > 0 ? quantitySum / totals.quantityVisitors : null
  return totals
}

export function funnelBySource(rows: VisitorRollup[], names: Map<string, string>) {
  const groups = new Map<string, VisitorRollup[]>()
  for (const row of rows) {
    const list = groups.get(row.sourceKey) ?? []
    list.push(row)
    groups.set(row.sourceKey, list)
  }
  return [...groups.entries()]
    .map(([sourceKey, group]): SourceFunnel => ({
      ...summarize(group),
      sourceKey,
      label: sourceLabel(sourceKey, names),
      code: sourceKey.startsWith("link:") ? sourceKey.slice(5) : "",
    }))
    .sort((a, b) => b.visits - a.visits || b.visitors - a.visitors || a.label.localeCompare(b.label, "ko"))
}

export function confirmedBuys() {
  return all<{ visitor_id: string; product_id: string; qty: number; amount: number }>(
    `SELECT visitor_id,
            product_id,
            SUM(CASE WHEN qty IS NULL THEN 1 ELSE qty END) AS qty,
            SUM(CASE WHEN price IS NULL THEN 0 ELSE price * CASE WHEN qty IS NULL THEN 1 ELSE qty END END) AS amount
     FROM events
     WHERE preview = 0 AND step = 'buy_click' AND ifnull(product_id, '') != ''
     GROUP BY visitor_id, product_id`,
  )
}

const PURCHASE_STEPS = new Set(["buy_click", "add_to_cart", "pay_click"])

export function eventPurchaseAmount(step: string, price: number | null, qty: number | null) {
  if (!PURCHASE_STEPS.has(step)) return null
  if (price == null || !Number.isFinite(price)) return null
  const units = qty == null ? 1 : qty
  if (!Number.isFinite(units)) return null
  return Math.round(price) * Math.round(units)
}

export type TimelineItem = {
  id: string
  visitorId: string
  createdAt: string
  step: string
  label: string
  detail: string
  note: string
  amount: number | null
}

type TimelineRow = {
  id: string
  visitor_id: string
  created_at: string
  step: string
  path: string
  link_code: string | null
  channel: string | null
  source: string | null
  medium: string | null
  campaign: string | null
  content: string | null
  referrer: string | null
  referrer_class: string | null
  product_id: string | null
  price: number | null
  qty: number | null
  meta: string | null
}

const TIMELINE_SQL = `SELECT id, visitor_id, created_at, step, path, link_code, channel, source, medium, campaign, content,
            referrer, referrer_class, product_id, price, qty, meta
     FROM events`

export function listActionTimes() {
  const rows = all<TimelineRow>(
    `${TIMELINE_SQL}
     WHERE preview = 0
     ORDER BY created_at ASC, id ASC`,
  )
  const names = linkNames()
  const products = listProducts(true)
  return rows.map((row) => toTimelineItem(row, names, products))
}

export function visitorTimeline(visitorId: string) {
  const rows = all<TimelineRow>(
    `${TIMELINE_SQL}
     WHERE visitor_id = ? AND preview = 0
     ORDER BY created_at ASC, id ASC`,
    [visitorId],
  )
  const names = linkNames()
  const products = listProducts(true)
  return rows.map((row) => toTimelineItem(row, names, products))
}

function toTimelineItem(row: TimelineRow, names: Map<string, string>, products: Product[]): TimelineItem {
  return {
    id: row.id,
    visitorId: row.visitor_id,
    createdAt: row.created_at,
    step: row.step,
    label: STEP_LABEL[row.step as Step] || row.step,
    detail: timelineDetail(row, names, products),
    note: actionNote(row, products),
    amount: eventPurchaseAmount(row.step, row.price, row.qty),
  }
}

function productLabel(productId: string | null, products: Product[]) {
  if (!productId) return ""
  const product = products.find((item) => item.id === productId)
  return product ? customerFacingTinName(product.name, product.slug) : ""
}

function actionNote(row: TimelineRow, products: Product[]) {
  const parts: string[] = []
  const label = productLabel(row.product_id, products)
  if (label) parts.push(label)
  if (row.step === "dwell") {
    const meta = readMeta(row.meta)
    const page = typeof meta.page === "string" ? DWELL_PAGE[meta.page] || "페이지" : "페이지"
    parts.push(`${page} ${formatDuration(Number(meta.seconds) || 0)}`)
  } else if (row.qty != null) {
    parts.push(`${row.qty}개`)
  }
  const amount = eventPurchaseAmount(row.step, row.price, row.qty)
  if (amount != null) parts.push(won(amount))
  if (!label && row.path && (row.step === "visit" || row.step === "return" || row.step === "cart_view" || row.step === "checkout_view")) {
    parts.push(row.path)
  }
  return parts.join(" · ")
}

function timelineDetail(row: TimelineRow, names: Map<string, string>, products: Product[]) {
  const parts: string[] = []
  const label = productLabel(row.product_id, products)
  if (label) parts.push(label)
  if (row.step === "dwell") {
    const meta = readMeta(row.meta)
    const page = typeof meta.page === "string" ? DWELL_PAGE[meta.page] || "페이지" : "페이지"
    const seconds = Number(meta.seconds) || 0
    parts.push(`${page} ${formatDuration(seconds)}`)
  }
  if (row.qty != null) parts.push(`수량 ${row.qty}`)
  if (row.price != null && row.step !== "dwell" && row.step !== "return" && row.step !== "visit") {
    parts.push(`단가 ${won(row.price)}`)
  }
  const amount = eventPurchaseAmount(row.step, row.price, row.qty)
  if (amount != null) parts.push(`합계 ${won(amount)}`)
  if (row.link_code) parts.push(names.get(row.link_code) || row.link_code)
  if (row.channel) parts.push(`채널 ${row.channel}`)
  if (row.source) parts.push(`소스 ${row.source}`)
  if (row.medium) parts.push(`매체 ${row.medium}`)
  if (row.campaign) parts.push(`캠페인 ${row.campaign}`)
  if (row.content) parts.push(`콘텐츠 ${row.content}`)
  if (row.referrer_class) parts.push(referrerLabel(row.referrer_class))
  if (row.referrer) parts.push(row.referrer)
  if (row.path) parts.push(row.path)
  const meta = readMeta(row.meta)
  const extra = metaLine(meta)
  if (row.step !== "dwell" && extra) parts.push(extra)
  return parts.join(" / ")
}

function metaLine(meta: Record<string, unknown>) {
  const parts: string[] = []
  if (typeof meta.method === "string") {
    const method = meta.method === "card" ? "카드" : meta.method === "easy" ? "간편결제" : meta.method === "transfer" ? "계좌이체" : meta.method
    parts.push(method)
  }
  if (typeof meta.nameFilled === "boolean") parts.push(meta.nameFilled ? "이름 입력" : "이름 없음")
  if (typeof meta.phoneFilled === "boolean") parts.push(meta.phoneFilled ? "전화 입력" : "전화 없음")
  return parts.join(", ")
}

function readMeta(raw: string | null) {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object") return {}
    return parsed as Record<string, unknown>
  } catch {
    return {}
  }
}
