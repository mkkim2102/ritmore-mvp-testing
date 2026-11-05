import { z } from "zod"
import { STEPS } from "@/lib/funnel"
import { MAX_QTY } from "@/lib/qty"
import { getRequestContext } from "@/lib/request"
import { recordEvent } from "@/lib/track"

const bodySchema = z.object({
  step: z.enum(STEPS),
  path: z.string().max(300).optional(),
  productSlug: z.string().max(80).optional(),
  method: z.enum(["card", "easy", "transfer"]).optional(),
  nameFilled: z.boolean().optional(),
  phoneFilled: z.boolean().optional(),
  qty: z.coerce.number().int().min(1).max(MAX_QTY).optional(),
  seconds: z.coerce.number().int().min(0).max(86400).optional(),
  page: z.enum(["home", "product", "cart", "checkout"]).optional(),
})

export async function POST(request: Request) {
  const json = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return Response.json({ ok: false, error: "기록 형식이 맞지 않습니다." }, { status: 400 })
  }

  const context = await getRequestContext()
  if (!context.visitorId || !context.sessionId) {
    return Response.json({ ok: false, error: "세션이 없습니다." }, { status: 400 })
  }

  if (parsed.data.step === "dwell") {
    const seconds = parsed.data.seconds ?? 0
    if (!parsed.data.page || seconds < 1) {
      return Response.json({ ok: true, duplicate: false, skipped: true })
    }
  }

  const meta = metaOf(parsed.data)
  const qty =
    parsed.data.step === "buy_open" ||
    parsed.data.step === "buy_click" ||
    parsed.data.step === "add_to_cart" ||
    parsed.data.step === "pay_click"
      ? (parsed.data.qty ?? null)
      : null

  const result = recordEvent({
    step: parsed.data.step,
    path: parsed.data.path || context.path || "/",
    productSlug: parsed.data.productSlug,
    visitorId: context.visitorId,
    sessionId: context.sessionId,
    preview: context.preview,
    returned: context.returned,
    touch: context.touch,
    qty,
    meta,
  })

  if (!result.ok) return Response.json(result, { status: 400 })
  return Response.json(result)
}

function metaOf(data: z.infer<typeof bodySchema>): Record<string, string | number | boolean | null> | undefined {
  if (data.step === "pay_click") {
    return {
      method: data.method ?? "card",
      nameFilled: data.nameFilled ?? false,
      phoneFilled: data.phoneFilled ?? false,
    }
  }
  if (data.step === "dwell" && data.page) {
    return {
      page: data.page,
      seconds: Math.min(data.seconds ?? 0, 14400),
    }
  }
  return undefined
}
