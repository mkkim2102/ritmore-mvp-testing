import { randomUUID } from "node:crypto"
import { all, run } from "@/lib/db"
import { BUY_REASONS } from "@/lib/survey-options"

export type SurveyInput = {
  visitorId: string
  sessionId: string
  linkCode: string | null
  referrerClass: string | null
  productSlug: string | null
  qty: number | null
  price: number | null
  ease: (typeof BUY_REASONS)[number]
  secondPress: string
  /** 3번 답. 최대 두 개를 " · "로 잇는다. surveys.intent 에 둔다. */
  intent: string
  note: string
  /** 2번에서 기타를 골랐을 때의 짧은 글. */
  likeNote: string
  /** 3번에서 기타를 골랐을 때의 짧은 글. */
  checkNote: string
  /** 4번. 언제, 어떤 상황에서 먹으려 했는지. 비어 있어도 된다. */
  whenNote: string
}

export function saveSurvey(input: SurveyInput) {
  run(
    `INSERT INTO surveys (
      id, created_at, visitor_id, session_id, link_code, referrer_class,
      product_slug, qty, price, ease, second_press, intent, note, like_note, check_note, when_note
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      input.likeNote,
      input.checkNote,
      input.whenNote,
    ],
  )
}

export type SurveyRow = {
  id: string
  created_at: string
  visitor_id: string
  session_id: string
  link_code: string | null
  referrer_class: string | null
  product_slug: string | null
  qty: number | null
  price: number | null
  ease: string
  second_press: string
  intent: string
  note: string
  like_note: string
  check_note: string
  when_note: string
}

export function listSurveys() {
  return all<SurveyRow>(`SELECT * FROM surveys ORDER BY created_at DESC LIMIT 200`)
}

/** 슬러그에 쉼표가 있으면 price는 이미 합계다. 아니면 단가여서 수량과 곱한다. */
export function surveyCharge(row: { product_slug: string | null; price: number | null; qty: number | null }) {
  if (row.price == null || row.qty == null) return null
  const stacked = (row.product_slug ?? "").includes(",")
  return stacked ? row.price : row.price * row.qty
}

/** 화면과 같은 상품 이름. 쉼표로 쌓인 슬러그도 각각 바꾼다. 없는 상품은 슬러그를 그대로 둔다. */
export function surveyProductName(raw: string | null, nameForSlug: (slug: string) => string | null) {
  if (!raw) return "—"
  return raw
    .split(",")
    .map((part) => part.split(":")[0])
    .filter(Boolean)
    .map((slug) => nameForSlug(slug) || slug)
    .join(", ")
}
