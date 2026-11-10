import { Workbook, type Worksheet } from "exceljs"
import { seoulDateTime, seoulToday, shortVisitorCode } from "@/lib/format"
import { referrerLabel } from "@/lib/referrer"
import { surveyCharge, surveyProductName, type SurveyRow } from "@/lib/survey"

export const SURVEY_SHEET = "설문"

export const SURVEY_HEADERS = [
  "시각",
  "방문자",
  "상품",
  "상품 코드",
  "링크",
  "리퍼러",
  "세션",
  "구매 이유",
  "마음에 든 점",
  "마음에 든 점 기타",
  "확인하고 싶은 점",
  "확인하고 싶은 점 기타",
  "언제",
  "수량",
  "단가",
  "금액",
  "말",
] as const

const COLUMN_WIDTHS = [18, 14, 28, 28, 16, 18, 38, 36, 36, 28, 36, 28, 28, 10, 12, 14, 28]

export function surveyExportFilename(now = new Date()) {
  const date = seoulToday(now).replace(/-/g, "")
  return { filename: `설문-${date}.xlsx`, ascii: `survey-${date}.xlsx` }
}

/** 넘긴 순서를 유지한다. listSurveys는 최신이 먼저다. */
export async function buildSurveyWorkbook(rows: SurveyRow[], nameForSlug: (slug: string) => string | null) {
  const workbook = new Workbook()
  workbook.creator = "ritmore"
  const sheet = workbook.addWorksheet(SURVEY_SHEET)
  sheet.addRow([...SURVEY_HEADERS])
  for (const row of rows) {
    sheet.addRow([
      seoulMinute(row.created_at),
      shortVisitorCode(row.visitor_id),
      surveyProductName(row.product_slug, nameForSlug),
      blank(row.product_slug),
      blank(row.link_code) ?? "—",
      referrerLabel(row.referrer_class),
      row.session_id,
      blank(row.ease),
      blank(row.second_press),
      blank(row.like_note),
      blank(row.intent),
      blank(row.check_note),
      blank(row.when_note),
      row.qty,
      row.price,
      surveyCharge(row),
      blank(row.note),
    ])
  }
  sheet.getColumn(14).numFmt = "0"
  sheet.getColumn(15).numFmt = "#,##0"
  sheet.getColumn(16).numFmt = "#,##0"
  finishSheet(sheet, SURVEY_HEADERS.length, COLUMN_WIDTHS)
  const raw = await workbook.xlsx.writeBuffer()
  return new Uint8Array(raw)
}

function seoulMinute(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso.slice(0, 16).replace("T", " ")
  return seoulDateTime(iso).slice(0, 16)
}

function blank(value: string | null | undefined) {
  if (value == null || value === "") return null
  return value
}

function finishSheet(sheet: Worksheet, columns: number, widths: number[]) {
  const header = sheet.getRow(1)
  header.font = { bold: true }
  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width
  })
  sheet.views = [{ state: "frozen", ySplit: 1 }]
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns },
  }
}
