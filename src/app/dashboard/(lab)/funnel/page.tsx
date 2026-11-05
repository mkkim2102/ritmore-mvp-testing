import { FunnelExport } from "@/components/dashboard/funnel-export"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatAverage, formatDuration, seoulToday, won } from "@/lib/format"
import { funnelBySource, linkNames, listVisitorRollups, summarize } from "@/lib/journey"

export const metadata = { title: "전체 퍼널" }

export default function FunnelPage() {
  const rows = listVisitorRollups()
  const totals = summarize(rows)
  const bySource = funnelBySource(rows, linkNames())

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl">전체 퍼널</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          실제 방문만 모았습니다. 미리보기 방문은 빠집니다. 숫자는 방문자 기준이고, 첫 구매하기와 구매 확정은 누른 횟수입니다.
          장바구니 담기와 장바구니 입장은 따로 셉니다. 출처는 각 방문자의 첫 진입입니다. 구매액은 결제 금액이고,
          구매하기 금액은 구매 확정의 실판매가에 수량을 곱해 더한 값입니다.
        </p>
      </div>

      <FunnelExport today={seoulToday()} />

      {rows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>아직 집계할 실제 방문이 없습니다</CardTitle>
            <CardDescription>방문이 쌓이면 방문, 구매, 장바구니, 후기, 체류, 수량이 여기에 모입니다.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-funnel-totals="">
            <Metric label="방문" value={`${totals.visits}명`} metric="visits" raw={totals.visits} />
            <Metric label="상품 조회" value={`${totals.productViews}명`} metric="product-views" raw={totals.productViews} />
            <Metric
              label="첫 구매하기"
              value={`${totals.buyOpens}회`}
              hint={`${totals.buyOpeners}명`}
              metric="buy-open"
              raw={totals.buyOpens}
            />
            <Metric
              label="구매 확정"
              value={`${totals.buyClicks}회`}
              hint={`${totals.buyers}명`}
              metric="buy-clicks"
              raw={totals.buyClicks}
            />
            <Metric label="장바구니 담기" value={`${totals.addToCart}명`} metric="add-to-cart" raw={totals.addToCart} />
            <Metric label="장바구니 입장" value={`${totals.cartViews}명`} metric="cart-view" raw={totals.cartViews} />
            <Metric label="결제 페이지" value={`${totals.checkoutViews}명`} metric="checkout-views" raw={totals.checkoutViews} />
            <Metric label="결제 클릭" value={`${totals.payClicks}명`} metric="pay-clicks" raw={totals.payClicks} />
            <PurchaseMetric payAmount={totals.payAmount} buyAmount={totals.buyAmount} />
            <Metric label="후기 클릭" value={`${totals.reviewClicks}명`} metric="review-clicks" raw={totals.reviewClicks} />
            <Metric
              label="체류 시간"
              value={totals.dwellVisitors > 0 ? formatDuration(totals.dwellSeconds) : "없음"}
              hint={totals.dwellVisitors > 0 ? `${totals.dwellVisitors}명 합계` : "기록 없음"}
              metric="dwell-seconds"
              raw={totals.dwellSeconds}
            />
            <Metric
              label="수량"
              value={totals.quantityAverage == null ? "없음" : `${formatAverage(totals.quantityAverage)}개`}
              hint={totals.quantityVisitors > 0 ? `마지막 수량, ${totals.quantityVisitors}명` : "고른 사람 없음"}
              metric="quantity"
              raw={totals.quantityVisitors}
            />
            <Metric label="다시 방문" value={`${totals.returned}명`} metric="returned" raw={totals.returned} />
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-2xl">첫 출처</h2>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>첫 출처</TableHead>
                    <TableHead className="text-right">방문</TableHead>
                    <TableHead className="text-right">상품 조회</TableHead>
                    <TableHead className="text-right">첫 구매하기</TableHead>
                    <TableHead className="text-right">구매 확정</TableHead>
                    <TableHead className="text-right">장바구니 담기</TableHead>
                    <TableHead className="text-right">장바구니 입장</TableHead>
                    <TableHead className="text-right">결제 페이지</TableHead>
                    <TableHead className="text-right">결제 클릭</TableHead>
                    <TableHead className="text-right">구매액</TableHead>
                    <TableHead className="text-right">후기 클릭</TableHead>
                    <TableHead className="text-right">체류</TableHead>
                    <TableHead className="text-right">수량</TableHead>
                    <TableHead className="text-right">다시 방문</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bySource.map((row) => (
                    <TableRow key={row.sourceKey} data-source-key={row.sourceKey}>
                      <TableCell>
                        {row.label}
                        {row.code ? <span className="block font-mono text-xs text-muted-foreground">{row.code}</span> : null}
                      </TableCell>
                      <Count value={row.visits} />
                      <Count value={row.productViews} />
                      <Count value={row.buyOpens} />
                      <Count value={row.buyClicks} />
                      <Count value={row.addToCart} />
                      <Count value={row.cartViews} />
                      <Count value={row.checkoutViews} />
                      <Count value={row.payClicks} />
                      <PurchaseCell payAmount={row.payAmount} buyAmount={row.buyAmount} />
                      <Count value={row.reviewClicks} />
                      <TableCell className="text-right whitespace-nowrap">
                        {row.dwellVisitors > 0 ? formatDuration(row.dwellSeconds) : "없음"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.quantityAverage == null ? "없음" : formatAverage(row.quantityAverage)}
                      </TableCell>
                      <Count value={row.returned} />
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function Metric({
  label,
  value,
  hint,
  metric,
  raw,
}: {
  label: string
  value: string
  hint?: string
  metric: string
  raw: number
}) {
  return (
    <Card size="sm" data-metric={metric} data-value={raw}>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="font-sans text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      {hint ? <CardContent className="text-sm text-muted-foreground">{hint}</CardContent> : null}
    </Card>
  )
}

function PurchaseMetric({ payAmount, buyAmount }: { payAmount: number; buyAmount: number }) {
  return (
    <Card
      size="sm"
      data-metric="purchase-amount"
      data-value={payAmount}
      data-pay-amount={payAmount}
      data-buy-amount={buyAmount}
    >
      <CardHeader>
        <CardDescription>구매액</CardDescription>
        <CardTitle className="font-sans text-3xl tabular-nums">{won(payAmount)}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <p data-figure="pay">결제 금액</p>
        {buyAmount > 0 ? <p data-figure="buy">구매하기 금액 {won(buyAmount)}</p> : null}
      </CardContent>
    </Card>
  )
}

function PurchaseCell({ payAmount, buyAmount }: { payAmount: number; buyAmount: number }) {
  return (
    <TableCell className="text-right whitespace-nowrap" data-pay-amount={payAmount} data-buy-amount={buyAmount}>
      <div className="tabular-nums" data-figure="pay">
        결제 금액 {won(payAmount)}
      </div>
      {buyAmount > 0 ? (
        <div className="text-xs text-muted-foreground tabular-nums" data-figure="buy">
          구매하기 금액 {won(buyAmount)}
        </div>
      ) : null}
    </TableCell>
  )
}

function Count({ value }: { value: number }) {
  return <TableCell className="text-right tabular-nums">{value}</TableCell>
}
