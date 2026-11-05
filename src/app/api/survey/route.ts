import { z } from "zod"
import { parseItems, priceLines } from "@/lib/catalog"
import { getRequestContext } from "@/lib/request"
import { classifyReferrer } from "@/lib/referrer"
import { saveSurvey } from "@/lib/survey"
import { EASE, INTENT, SECOND_PRESS } from "@/lib/survey-options"

const bodySchema = z.object({
  items: z.string().max(200).optional(),
  ease: z.enum(EASE),
  secondPress: z.enum(SECOND_PRESS),
  intent: z.enum(INTENT),
  note: z.string().max(500).optional(),
})

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

  const line = priceLines(parseItems(parsed.data.items), context.touch)[0]
  saveSurvey({
    visitorId: context.visitorId,
    sessionId: context.sessionId,
    linkCode: context.touch.linkCode,
    referrerClass: classifyReferrer(context.touch.referrer),
    productSlug: line?.product.slug ?? null,
    qty: line?.qty ?? null,
    price: line?.offer.price ?? null,
    ease: parsed.data.ease,
    secondPress: parsed.data.secondPress,
    intent: parsed.data.intent,
    note: (parsed.data.note ?? "").trim(),
  })

  return Response.json({ ok: true })
}
