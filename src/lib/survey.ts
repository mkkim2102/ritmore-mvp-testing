import { randomUUID } from "node:crypto"
import { all, run } from "@/lib/db"
import { EASE, INTENT, SECOND_PRESS } from "@/lib/survey-options"

export { EASE, INTENT, SECOND_PRESS }

export type SurveyInput = {
  visitorId: string
  sessionId: string
  linkCode: string | null
  referrerClass: string | null
  productSlug: string | null
  qty: number | null
  price: number | null
  ease: (typeof EASE)[number]
  secondPress: (typeof SECOND_PRESS)[number]
  intent: (typeof INTENT)[number]
  note: string
}

export function saveSurvey(input: SurveyInput) {
  run(
    `INSERT INTO surveys (
      id, created_at, visitor_id, session_id, link_code, referrer_class,
      product_slug, qty, price, ease, second_press, intent, note
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      randomUUID(),
      new Date().toISOString(),
      input.visitorId,
      input.sessionId,
      input.linkCode,
      input.referrerClass,
      input.productSlug,
      input.qty,
      input.price,
      input.ease,
      input.secondPress,
      input.intent,
      input.note,
    ],
  )
}

export type SurveyRow = {
  id: string
  created_at: string
  visitor_id: string
  link_code: string | null
  referrer_class: string | null
  product_slug: string | null
  qty: number | null
  price: number | null
  ease: string
  second_press: string
  intent: string
  note: string
}

export function listSurveys() {
  return all<SurveyRow>(`SELECT * FROM surveys ORDER BY created_at DESC LIMIT 200`)
}
