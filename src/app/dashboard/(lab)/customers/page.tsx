import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { customerFacingTinName } from "@/lib/bundles"
import { listProducts } from "@/lib/catalog"
import { formatDuration, formatWhen, shortVisitorCode, won } from "@/lib/format"
import { confirmedBuys, linkNames, listVisitorRollups, sourceLabel, visitorVisitAndBuyTimes, type BuyClickStamp, type VisitStamp } from "@/lib/journey"
import { referrerLabel } from "@/lib/referrer"

export const metadata = { title: "방문자" }

export default function CustomersPage() {
  const names = linkNames()
  const rows = listVisitorRollups()
  const products = listProducts(true)
  const moments = new Map(visitorVisitAndBuyTimes().map((item) => [item.visitorId, item]))
  const buys = new Map<string, string[]>()
  for (const buy of confirmedBuys()) {
    const product = products.find((item) => item.id === buy.product_id)
    const label = product ? customerFacingTinName(product.name, product.slug) : buy.product_id
    const line = `${label} ${buy.qty}개 ${won(buy.amount)}`
    const list = buys.get(buy.visitor_id) ?? []
    list.push(line)
    buys.set(buy.visitor_id, list)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl">방문자</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          브라우저에 남긴 방문자 번호만 보여 줍니다. 이름과 전화번호는 저장하지 않습니다. 미리보기 방문은 빠집니다.
          구매 확정 금액은 고른 옵션의 실판매가에 수량을 곱한 합입니다. 결제 금액은 결제 버튼을 누른 합입니다.
          들어온 시각은 방문이 기록된 때이고, 구매 확정 시각은 구매를 확정한 때입니다.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
          아직 방문자가 없습니다.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>방문자</TableHead>
                <TableHead>첫 출처</TableHead>
                <TableHead>처음</TableHead>
                <TableHead>마지막</TableHead>
                <TableHead>들어온 시각</TableHead>
                <TableHead>구매 확정 시각</TableHead>
                <TableHead className="text-right">체류</TableHead>
                <TableHead>다시 방문</TableHead>
                <TableHead className="text-right">첫 구매하기</TableHead>
                <TableHead className="text-right">구매 확정</TableHead>
                <TableHead>확정한 옵션</TableHead>
                <TableHead className="text-right">구매 확정 금액</TableHead>
                <TableHead className="text-right">결제 금액</TableHead>
                <TableHead>장바구니 담기</TableHead>
                <TableHead>장바구니 입장</TableHead>
                <TableHead className="text-right">수량</TableHead>
                <TableHead>후기</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const stamp = moments.get(row.id)
                const visits = stamp?.visits ?? []
                const buyClicks = stamp?.buyClicks ?? []
                return (
                  <TableRow
                    key={row.id}
                    data-visitor={row.id}
                    data-source={row.sourceKey}
                    data-buy-opens={row.buyOpens}
                    data-buys={row.buyClicks}
                    data-purchase-amount={row.buyAmount}
                    data-pay-amount={row.payAmount}
                    data-cart={row.addedCart ? "yes" : "no"}
                    data-cart-view={row.viewedCart ? "yes" : "no"}
                    data-review={row.reviewClick ? "yes" : "no"}
                    data-qty={row.lastQty ?? ""}
                    data-returned={row.returned ? "yes" : "no"}
                    data-dwell={row.dwellSeconds}
                    data-arrivals={visits.map((visit) => visit.createdAt).join(",")}
                    data-buy-times={buyClicks.map((buy) => buy.createdAt).join(",")}
                  >
                    <TableCell className="font-mono text-xs">
                      <Link href={`/dashboard/customers/${row.id}`} className="underline-offset-2 hover:underline">
                        {shortVisitorCode(row.id)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {sourceLabel(row.sourceKey, names)}
                      {row.linkCode ? <span className="block font-mono text-xs text-muted-foreground">{row.linkCode}</span> : null}
                      <span className="block text-xs text-muted-foreground">{referrerLabel(row.referrerClass)}</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatWhen(row.firstSeen)}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatWhen(row.lastSeen)}</TableCell>
                    <TableCell>{visitLines(visits)}</TableCell>
                    <TableCell>{buyLines(buyClicks, products)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {row.dwellSeconds > 0 ? formatDuration(row.dwellSeconds) : "없음"}
                    </TableCell>
                    <TableCell>{row.returned ? "예" : "아니오"}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.buyOpens}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.buyClicks}</TableCell>
                    <TableCell className="max-w-64 text-xs whitespace-normal">{buys.get(row.id)?.join(", ") || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums whitespace-nowrap">{won(row.buyAmount)}</TableCell>
                    <TableCell className="text-right tabular-nums whitespace-nowrap">{won(row.payAmount)}</TableCell>
                    <TableCell>{row.addedCart ? "예" : "아니오"}</TableCell>
                    <TableCell>{row.viewedCart ? "예" : "아니오"}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.lastQty == null ? "없음" : row.lastQty}</TableCell>
                    <TableCell>{row.reviewClick ? "예" : "아니오"}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function visitLines(visits: VisitStamp[]) {
  if (visits.length === 0) return "—"
  return visits.map((visit, index) => (
    <span key={`${visit.createdAt}-${index}`} className="block whitespace-nowrap text-xs">
      {formatWhen(visit.createdAt)}
      {visit.path ? <span className="text-muted-foreground"> {visit.path}</span> : null}
    </span>
  ))
}

function buyLines(buys: BuyClickStamp[], products: ReturnType<typeof listProducts>) {
  if (buys.length === 0) return "—"
  return buys.map((buy, index) => {
    const note = buyOptionNote(buy, products)
    return (
      <span key={`${buy.createdAt}-${index}`} className="block whitespace-nowrap text-xs">
        {formatWhen(buy.createdAt)}
        {note ? <> {note}</> : null}
      </span>
    )
  })
}

function buyOptionNote(buy: BuyClickStamp, products: ReturnType<typeof listProducts>) {
  const product = buy.productId ? products.find((item) => item.id === buy.productId) : undefined
  const name = product ? customerFacingTinName(product.name, product.slug) : buy.productId || ""
  const count = buy.qty == null ? "" : `${buy.qty}개`
  return [name, count].filter(Boolean).join(" ")
}
