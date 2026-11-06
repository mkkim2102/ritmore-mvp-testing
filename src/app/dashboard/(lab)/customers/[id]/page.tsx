import Link from "next/link"
import { notFound } from "next/navigation"
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
import { linkNames, listVisitorRollups, sourceLabel, visitorTimeline, visitorVisitAndBuyTimes, type BuyClickStamp, type VisitStamp } from "@/lib/journey"
import { referrerLabel } from "@/lib/referrer"

export const metadata = { title: "방문자 여정" }

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const query = await searchParams
  const listHref = listHrefFrom(query)
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(id)) notFound()

  const visitor = listVisitorRollups().find((row) => row.id === id)
  const timeline = visitorTimeline(id)
  if (!visitor || timeline.length === 0) {
    return (
      <div className="space-y-4">
        <Link href={listHref} className="text-sm text-muted-foreground hover:underline">
          방문자 목록
        </Link>
        <p className="rounded-2xl border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
          이 방문자를 찾지 못했습니다.
        </p>
      </div>
    )
  }

  const names = linkNames()
  const products = listProducts(true)
  const moments = visitorVisitAndBuyTimes(id)[0]
  const visits = moments?.visits ?? []
  const buyClicks = moments?.buyClicks ?? []

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link href={listHref} className="text-sm text-muted-foreground hover:underline">
          방문자 목록
        </Link>
        <h2 className="font-serif text-2xl">방문자 세부</h2>
        <p className="font-mono text-xs" data-visitor={visitor.id}>
          {shortVisitorCode(visitor.id)}
        </p>
        <p className="text-sm text-muted-foreground">이 방문자의 요약과 행동 시각입니다.</p>
      </div>

      <dl
        className="grid gap-3 rounded-2xl border border-border bg-card p-4 text-sm sm:grid-cols-2 lg:grid-cols-3"
        data-purchase-amount={visitor.buyAmount}
        data-pay-amount={visitor.payAmount}
      >
        <Item label="첫 출처" value={sourceLabel(visitor.sourceKey, names)} />
        <Item label="처음" value={formatWhen(visitor.firstSeen)} />
        <Item label="마지막" value={formatWhen(visitor.lastSeen)} />
        <div className="sm:col-span-2 lg:col-span-3" data-arrivals={visits.map((visit) => visit.createdAt).join(",")}>
          <dt className="text-xs text-muted-foreground">들어온 시각</dt>
          <dd className="mt-1">{visitLines(visits)}</dd>
        </div>
        <div className="sm:col-span-2 lg:col-span-3" data-buy-times={buyClicks.map((buy) => buy.createdAt).join(",")}>
          <dt className="text-xs text-muted-foreground">구매 확정 시각</dt>
          <dd className="mt-1">{buyLines(buyClicks, products)}</dd>
        </div>
        <Item label="체류" value={visitor.dwellSeconds > 0 ? formatDuration(visitor.dwellSeconds) : "없음"} />
        <Item label="다시 방문" value={visitor.returned ? "예" : "아니오"} />
        <Item label="첫 구매하기" value={`${visitor.buyOpens}회`} />
        <Item label="구매 확정" value={`${visitor.buyClicks}회`} />
        <Item label="구매 확정 금액" value={won(visitor.buyAmount)} />
        <Item label="결제 금액" value={won(visitor.payAmount)} />
        <Item label="리퍼러" value={referrerLabel(visitor.referrerClass)} />
        <Item label="장바구니 담기" value={visitor.addedCart ? "예" : "아니오"} />
        <Item label="장바구니 입장" value={visitor.viewedCart ? "예" : "아니오"} />
        <Item label="수량" value={visitor.lastQty == null ? "없음" : String(visitor.lastQty)} />
        <Item label="후기" value={visitor.reviewClick ? "예" : "아니오"} />
      </dl>

      <div className="space-y-3">
        <h3 className="font-serif text-xl">행동 시각</h3>
        <p className="text-sm text-muted-foreground">이 방문자가 한 행동을 시간순으로 보여 줍니다.</p>
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>시각</TableHead>
              <TableHead>행동</TableHead>
              <TableHead>내용</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {timeline.map((item) => (
              <TableRow key={item.id} data-timeline-step={item.step} data-action-at={item.createdAt} data-amount={item.amount ?? ""}>
                <TableCell className="whitespace-nowrap">{formatWhen(item.createdAt)}</TableCell>
                <TableCell>{item.label}</TableCell>
                <TableCell>{item.detail || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </div>
    </div>
  )
}

function listHrefFrom(query: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (key === "page" || value == null) continue
    const values = Array.isArray(value) ? value : [value]
    for (const item of values) params.append(key, item)
  }
  const raw = Array.isArray(query.page) ? query.page[0] : query.page
  const requested = Number(raw)
  if (Number.isFinite(requested) && requested > 1) params.set("page", String(Math.floor(requested)))
  const search = params.toString()
  return search ? `/dashboard/customers?${search}` : "/dashboard/customers"
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

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  )
}
