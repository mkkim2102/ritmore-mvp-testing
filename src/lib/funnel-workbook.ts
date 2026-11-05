import { Workbook, type Worksheet } from "exceljs"
import { seoulDateTime, seoulDayBounds, shortVisitorCode } from "@/lib/format"
import { STEP_LABEL, type Step } from "@/lib/funnel"
import {
  eventPurchaseAmount,
  funnelBySource,
  sourceKeyOf,
  sourceLabel,
  summarize,
  type VisitorRollup,
  type WindowEvent,
} from "@/lib/journey"
import { referrerLabel } from "@/lib/referrer"

export type ExportQuery =
  | { ok: true; fromIso: string | null; untilIso: string | null; label: string; filename: string }
  | { ok: false; error: string }

const SUMMARY_HEADERS = [
  "출처",
  "링크 코드",
  "방문",
  "상품 조회",
  "첫 구매하기",
  "구매 확정",
  "장바구니 담기",
  "장바구니 입장",
  "결제 페이지",
  "결제 클릭",
  "후기 클릭",
  "체류 초",
  "수량",
  "다시 방문",
  "구매액",
  "구매하기 금액",
] as const

const DETAIL_HEADERS = [
  "시각",
  "방문자",
  "출처",
  "링크 코드",
  "유입",
  "이벤트",
  "경로",
  "수량",
  "단가",
  "구매액",
  "방문자 아이디",
] as const

export function parseExportQuery(params: { get(name: string): string | null }): ExportQuery {
  const scope = (params.get("scope") || "all").trim()
  if (scope === "all") {
    return { ok: true, fromIso: null, untilIso: null, label: "전체", filename: "funnel-all.xlsx" }
  }
  if (scope === "day") {
    const date = (params.get("date") || "").trim()
    const bounds = seoulDayBounds(date)
    if (!bounds) return { ok: false, error: "날짜를 확인해 주세요." }
    return {
      ok: true,
      fromIso: bounds.start,
      untilIso: bounds.end,
      label: `${date} (서울, 하루)`,
      filename: `funnel-${date}.xlsx`,
    }
  }
  if (scope === "range") {
    const from = (params.get("from") || "").trim()
    const to = (params.get("to") || "").trim()
    const start = seoulDayBounds(from)
    const end = seoulDayBounds(to)
    if (!start || !end) return { ok: false, error: "시작일과 종료일을 확인해 주세요." }
    if (from > to) return { ok: false, error: "시작일이 종료일보다 늦습니다." }
    return {
      ok: true,
      fromIso: start.start,
      untilIso: end.end,
      label: `${from} ~ ${to} (서울, 양끝 포함)`,
      filename: `funnel-${from}_${to}.xlsx`,
    }
  }
  return { ok: false, error: "기간을 확인해 주세요." }
}

export async function buildFunnelWorkbook(input: {
  period: string
  rollups: VisitorRollup[]
  events: WindowEvent[]
  names: Map<string, string>
}) {
  const workbook = new Workbook()
  workbook.creator = "ritmore"
  writeSummary(workbook, input.period, input.rollups, input.names)
  writeDetail(workbook, input.period, input.events, input.names)
  const raw = await workbook.xlsx.writeBuffer()
  return new Uint8Array(raw)
}

function writeSummary(workbook: Workbook, period: string, rollups: VisitorRollup[], names: Map<string, string>) {
  const sheet = workbook.addWorksheet("요약")
  sheet.addRow(["기간", period])
  sheet.addRow([...SUMMARY_HEADERS])
  const sources = funnelBySource(rollups, names)
  for (const row of sources) {
    sheet.addRow([
      row.label,
      row.code || null,
      row.visits,
      row.productViews,
      row.buyOpens,
      row.buyClicks,
      row.addToCart,
      row.cartViews,
      row.checkoutViews,
      row.payClicks,
      row.reviewClicks,
      row.dwellSeconds,
      quantityCell(row.quantityAverage),
      row.returned,
      row.payAmount,
      row.buyAmount,
    ])
  }
  const totals = summarize(rollups)
  const total = sheet.addRow([
    "합계",
    null,
    totals.visits,
    totals.productViews,
    totals.buyOpens,
    totals.buyClicks,
    totals.addToCart,
    totals.cartViews,
    totals.checkoutViews,
    totals.payClicks,
    totals.reviewClicks,
    totals.dwellSeconds,
    quantityCell(totals.quantityAverage),
    totals.returned,
    totals.payAmount,
    totals.buyAmount,
  ])
  total.font = { bold: true }
  sheet.getColumn(13).numFmt = "0.0"
  sheet.getColumn(15).numFmt = "#,##0"
  sheet.getColumn(16).numFmt = "#,##0"
  finishSheet(sheet, SUMMARY_HEADERS.length, [22, 16, 12, 14, 14, 12, 14, 14, 14, 12, 12, 12, 10, 12, 14, 16])
}

function writeDetail(workbook: Workbook, period: string, events: WindowEvent[], names: Map<string, string>) {
  const sheet = workbook.addWorksheet("상세")
  sheet.addRow(["기간", period])
  sheet.addRow([...DETAIL_HEADERS])
  for (const event of events) {
    const sourceKey = sourceKeyOf(event.linkCode, event.referrerClass)
    sheet.addRow([
      seoulDateTime(event.createdAt),
      shortVisitorCode(event.visitorId),
      sourceLabel(sourceKey, names),
      event.linkCode || null,
      referrerLabel(event.referrerClass),
      STEP_LABEL[event.step as Step] || event.step,
      event.path,
      event.qty,
      event.price,
      eventPurchaseAmount(event.step, event.price, event.qty),
      event.visitorId,
    ])
  }
  sheet.getColumn(8).numFmt = "0"
  sheet.getColumn(9).numFmt = "#,##0"
  sheet.getColumn(10).numFmt = "#,##0"
  finishSheet(sheet, DETAIL_HEADERS.length, [22, 12, 18, 16, 18, 14, 28, 10, 12, 14, 40])
}

function quantityCell(value: number | null) {
  if (value == null || !Number.isFinite(value)) return null
  return Math.round(value * 10) / 10
}

function finishSheet(sheet: Worksheet, columns: number, widths: number[]) {
  const header = sheet.getRow(2)
  header.font = { bold: true }
  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width
  })
  sheet.views = [{ state: "frozen", ySplit: 2 }]
  sheet.autoFilter = {
    from: { row: 2, column: 1 },
    to: { row: 2, column: columns },
  }
}
