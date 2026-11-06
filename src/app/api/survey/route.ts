import { z } from "zod"
import { publicProductSlug } from "@/lib/bundles"
import { parseItems, priceLines } from "@/lib/catalog"
import { getRequestContext } from "@/lib/request"
import { classifyReferrer } from "@/lib/referrer"
import { saveSurvey } from "@/lib/survey"
import { BUY_CHECKS, BUY_LIKES, BUY_REASONS, OTHER_CHECK, OTHER_LIKE, OTHER_REASON } from "@/lib/survey-options"

const bodySchema = z.object({
  items: z.string().max(200).optional(),
  reason: z.enum(BUY_REASONS),
  likes: z.array(z.enum(BUY_LIKES)).max(2),
  other: z.string().max(500).optional(),
  likeOther: z.string().max(500).optional(),
  checks: z.array(z.enum(BUY_CHECKS)).max(2),
  checkOther: z.string().max(500).optional(),
  when: z.string().max(500).optional(),
})

function unique<T>(values: T[]) {
  return [...new Set(values)]
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return Response.json({ ok: false, error: "설문 형식이 맞지 않습니다." }, { status: 400 })
  }

  const context = await getRequestContext()
  if (!context.visitorId || !context.sessionId) {
    return Response.json({ ok: false, error: "세션이 없습니다." }, { status: 400 })
  }

  const lines = priceLines(parseItems(parsed.data.items), context.touch)
  const likes = unique(parsed.data.likes)
  const checks = unique(parsed.data.checks)
  if (likes.length !== parsed.data.likes.length || checks.length !== parsed.data.checks.length) {
    return Response.json({ ok: false, error: "설문 형식이 맞지 않습니다." }, { status: 400 })
  }
  const other = parsed.data.reason === OTHER_REASON ? (parsed.data.other ?? "").trim() : ""
  const likeOther = likes.includes(OTHER_LIKE) ? (parsed.data.likeOther ?? "").trim() : ""
  const checkOther = checks.includes(OTHER_CHECK) ? (parsed.data.checkOther ?? "").trim() : ""
  const whenNote = (parsed.data.when ?? "").trim()
  const qty = lines.reduce((sum, line) => sum + line.qty, 0)
  const total = lines.reduce((sum, line) => sum + line.offer.price * line.qty, 0)
  saveSurvey({
    visitorId: context.visitorId,
    sessionId: context.sessionId,
    linkCode: context.touch.linkCode,
    referrerClass: classifyReferrer(context.touch.referrer),
    productSlug: lines.map((line) => publicProductSlug(line.product.slug)).join(",") || null,
    qty: qty || null,
    // One line keeps the unit price. Several lines store the order total; the slug list then contains a comma.
    price: lines.length === 1 ? lines[0].offer.price : lines.length > 1 ? total : null,
    ease: parsed.data.reason,
    secondPress: likes.join(" · "),
    intent: checks.join(" · "),
    note: other,
    likeNote: likeOther,
    checkNote: checkOther,
    whenNote,
  })

  return Response.json({ ok: true })
}
