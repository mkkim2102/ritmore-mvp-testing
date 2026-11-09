import { Workbook, type Worksheet } from "exceljs"
import { formatDuration, seoulDateTime, shortVisitorCode } from "@/lib/format"
import { sourceLabel, type JourneyRow, type VisitorRollup } from "@/lib/journey"
import { referrerLabel } from "@/lib/referrer"

const SUMMARY_HEADERS = [
  "방문자",
  "첫 출처",
  "처음",
  "마지막",
  "체류",
  "다시 방문",
  "첫 구매하기 횟수",
  "구매 확정 횟수",
  "확정한 옵션",
  "구매 확정 금액",
  "결제 금액",
  "장바구니 담기",
  "장바구니 입장",
  "수량",
  "후기",
] as const

const JOURNEY_HEADERS = ["방문자", "시각", "행동", "내용", "경로", "상품", "수량", "단가", "합계", "링크", "리퍼러"] as const

export async function buildCustomerJourneyWorkbook(input: {
  visitors: VisitorRollup[]
  events: JourneyRow[]
  names: Map<string, string>
  optionText: Map<string, string>
  productNames: Map<string, string>
}) {
  const workbook = new Workbook()
  workbook.creator = "ritmore"
  writeSummary(workbook, input.visitors, input.names, input.optionText)
  writeJourney(workbook, input.events, input.productNames)
  const raw = await workbook.xlsx.writeBuffer()
  return new Uint8Array(raw)
}

export function xlsxHeaders(filename: string, asciiName: string) {
  const encoded = encodeURIComponent(filename)
  return {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encoded}`,
    "Cache-Control": "no-store",
  }
}

function writeSummary(
  workbook: Workbook,
  visitors: VisitorRollup[],
  names: Map<string, string>,
  optionText: Map<string, string>,
) {
  const sheet = workbook.addWorksheet("요약")
  sheet.addRow([...SUMMARY_HEADERS])
  for (const row of visitors) {
    sheet.addRow([
      shortVisitorCode(row.id),
      sourceLabel(row.sourceKey, names),
      seoulMinute(row.firstSeen),
      seoulMinute(row.lastSeen),
      row.dwellSeconds > 0 ? formatDuration(row.dwellSeconds) : "없음",
      yesNo(row.returned),
      row.buyOpens,
      row.buyClicks,
      optionText.get(row.id) || "—",
      row.buyAmount,
      row.payAmount,
      yesNo(row.addedCart),
      yesNo(row.viewedCart),
      row.lastQty == null ? "없음" : row.lastQty,
      yesNo(row.reviewClick),
    ])
  }
  sheet.getColumn(7).numFmt = "0"
  sheet.getColumn(8).numFmt = "0"
  sheet.getColumn(10).numFmt = "#,##0"
  sheet.getColumn(11).numFmt = "#,##0"
  finishSheet(sheet, SUMMARY_HEADERS.length, [14, 18, 18, 18, 14, 12, 18, 16, 36, 16, 14, 14, 16, 10, 10])
}

function writeJourney(workbook: Workbook, events: JourneyRow[], productNames: Map<string, string>) {
  const sheet = workbook.addWorksheet("여정")
  sheet.addRow([...JOURNEY_HEADERS])
  const ordered = [...events].sort(oldestFirst)
  for (const event of ordered) {
    sheet.addRow([
      shortVisitorCode(event.visitorId),
      seoulMinute(event.createdAt),
      event.label,
      event.detail || null,
      event.path || null,
      productCell(event.productId, productNames),
      event.qty,
      event.price,
      event.amount,
      event.linkLabel || null,
      referrerLabel(event.referrerClass),
    ])
  }
  sheet.getColumn(7).numFmt = "0"
  sheet.getColumn(8).numFmt = "#,##0"
  sheet.getColumn(9).numFmt = "#,##0"
  finishSheet(sheet, JOURNEY_HEADERS.length, [14, 18, 14, 48, 28, 24, 10, 12, 12, 18, 18])
}

function productCell(productId: string | null, productNames: Map<string, string>) {
  if (!productId) return null
  return productNames.get(productId) || productId
}

function oldestFirst(a: JourneyRow, b: JourneyRow) {
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1
  if (a.id !== b.id) return a.id < b.id ? -1 : 1
  return 0
}

function seoulMinute(iso: string) {
  return seoulDateTime(iso).slice(0, 16)
}

function yesNo(value: boolean) {
  return value ? "예" : "아니오"
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
