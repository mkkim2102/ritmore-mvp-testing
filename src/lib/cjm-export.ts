import { customerFacingTinName } from "@/lib/bundles"
import { filterCustomerRollups, indexConfirmedBuys, type CustomerListQuery } from "@/lib/customer-filters"
import { buildCustomerJourneyWorkbook } from "@/lib/cjm-workbook"
import { listProducts } from "@/lib/catalog"
import { seoulToday, shortVisitorCode } from "@/lib/format"
import { confirmedBuys, linkNames, listJourneyRows, listVisitorRollups, type VisitorRollup } from "@/lib/journey"

export function bulkCjmFilename(now = new Date()) {
  const date = seoulToday(now)
  return { filename: `고객여정-${date}.xlsx`, ascii: `cjm-${date}.xlsx` }
}

export function visitorCjmFilename(visitorId: string) {
  const code = shortVisitorCode(visitorId)
  return { filename: `고객여정-${code}.xlsx`, ascii: `cjm-${code}.xlsx` }
}

export async function buildFilteredCustomerWorkbook(query: CustomerListQuery) {
  const loaded = loadCustomerExport()
  const visitors = filterCustomerRollups(loaded.rows, query, loaded.buyersByProduct)
  return workbookFor(loaded, visitors)
}

export async function buildVisitorCustomerWorkbook(visitorId: string) {
  const loaded = loadCustomerExport()
  const visitor = loaded.rows.find((row) => row.id === visitorId)
  if (!visitor) return null
  return workbookFor(loaded, [visitor])
}

function loadCustomerExport() {
  const products = listProducts(true)
  const productNames = new Map<string, string>()
  for (const product of products) {
    productNames.set(product.id, customerFacingTinName(product.name, product.slug))
  }
  const indexed = indexConfirmedBuys(confirmedBuys(), (productId) => productNames.get(productId) || productId)
  return {
    rows: listVisitorRollups(),
    names: linkNames(),
    productNames,
    lines: indexed.lines,
    buyersByProduct: indexed.buyersByProduct,
  }
}

function workbookFor(
  loaded: ReturnType<typeof loadCustomerExport>,
  visitors: VisitorRollup[],
) {
  const optionText = new Map<string, string>()
  for (const visitor of visitors) optionText.set(visitor.id, loaded.lines.get(visitor.id)?.join(", ") ?? "")
  return buildCustomerJourneyWorkbook({
    visitors,
    events: listJourneyRows(visitors.map((visitor) => visitor.id)),
    names: loaded.names,
    optionText,
    productNames: loaded.productNames,
  })
}
