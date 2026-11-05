import { randomUUID } from "node:crypto"
import { getLinkByCode, getProductBySlug, resolveOffer } from "@/lib/catalog"
import { run } from "@/lib/db"
import { dedupeKey, repeatsPerSession, type Step } from "@/lib/funnel"
import { classifyReferrer, publicReferrer } from "@/lib/referrer"
import { safePath, type Touch } from "@/lib/touch"

export function recordEvent(input: {
  step: Step
  path: string
  productSlug?: string | null
  visitorId: string
  sessionId: string
  preview: boolean
  touch: Touch
  qty?: number | null
  returned?: boolean
  meta?: Record<string, string | boolean | number | null>
}) {
  if (input.returned && input.step !== "return") {
    recordEvent({
      step: "return",
      path: input.path,
      visitorId: input.visitorId,
      sessionId: input.sessionId,
      preview: input.preview,
      touch: input.touch,
      returned: false,
    })
  }
  const product = input.productSlug ? getProductBySlug(input.productSlug) : null
  if (
    (input.step === "product_view" ||
      input.step === "buy_open" ||
      input.step === "buy_click" ||
      input.step === "add_to_cart") &&
    !product
  ) {
    return { ok: false as const, error: "상품을 찾지 못했습니다." }
  }

  const productId =
    input.step === "visit" || input.step === "catalog_view" ? null : (product?.id ?? null)
  const offer = product && productId ? resolveOffer(product, input.touch) : null
  const link = input.touch.linkCode ? getLinkByCode(input.touch.linkCode) : null
  const referrer = publicReferrer(input.touch.referrer)
  const referrerClass = classifyReferrer(referrer)
  const channel = link?.channel || input.touch.source || referrerClass

  try {
    run(
      `INSERT INTO events (
        id, created_at, visitor_id, session_id, dedupe_key, step, path, link_code, channel,
        source, medium, campaign, content, referrer, referrer_class, experiment_id, product_id, variant_id, price, qty, preview, meta
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        new Date().toISOString(),
        input.visitorId,
        input.sessionId,
        dedupeKey(input.step, productId, repeatsPerSession(input.step) ? randomUUID() : undefined),
        input.step,
        safePath(input.path),
        input.touch.linkCode,
        channel,
        link?.utmSource || input.touch.source,
        link?.utmMedium || input.touch.medium,
        link?.utmCampaign || input.touch.campaign,
        link?.utmContent || input.touch.content,
        referrer,
        referrerClass,
        offer?.experimentId ?? null,
        productId,
        offer?.variantId ?? null,
        offer?.price ?? null,
        input.qty ?? null,
        input.preview ? 1 : 0,
        input.meta ? JSON.stringify(input.meta) : null,
      ],
    )
    return { ok: true as const, duplicate: false }
  } catch (error) {
    const message = error instanceof Error ? error.message : ""
    if (message.includes("UNIQUE")) return { ok: true as const, duplicate: true }
    throw error
  }
}

export function recordCartView(input: {
  path: string
  visitorId: string
  sessionId: string
  preview: boolean
  prefetch: boolean
  document: boolean
  returned: boolean
  touch: Touch
}) {
  if (!input.document || input.prefetch || !input.visitorId || !input.sessionId) return
  try {
    recordEvent({
      step: "cart_view",
      path: input.path || "/cart",
      visitorId: input.visitorId,
      sessionId: input.sessionId,
      preview: input.preview,
      returned: input.returned,
      touch: input.touch,
    })
  } catch (error) {
    console.error(error)
  }
}

export function recordPageVisit(input: {
  path: string
  visitorId: string
  sessionId: string
  preview: boolean
  prefetch: boolean
  document: boolean
  returned: boolean
  touch: Touch
}) {
  if (!input.document || input.prefetch || !input.visitorId || !input.sessionId) return
  try {
    recordEvent({
      step: "visit",
      path: input.path,
      visitorId: input.visitorId,
      sessionId: input.sessionId,
      preview: input.preview,
      returned: input.returned,
      touch: input.touch,
    })
  } catch (error) {
    console.error(error)
  }
}
