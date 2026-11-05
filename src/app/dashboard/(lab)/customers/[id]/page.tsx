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
import { formatDuration, formatWhen, shortVisitorCode, won } from "@/lib/format"
import { linkNames, listVisitorRollups, sourceLabel, visitorTimeline } from "@/lib/journey"

export const metadata = { title: "방문자 여정" }

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(id)) notFound()

  const visitor = listVisitorRollups().find((row) => row.id === id)
  const timeline = visitorTimeline(id)
  if (!visitor || timeline.length === 0) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/customers" className="text-sm text-muted-foreground hover:underline">
          방문자 목록
        </Link>
        <p className="rounded-2xl border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
          이 방문자를 찾지 못했습니다.
        </p>
      </div>
    )
  }

  const names = linkNames()

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link href="/dashboard/customers" className="text-sm text-muted-foreground hover:underline">
          방문자 목록
        </Link>
        <h2 className="font-serif text-2xl">방문자 여정</h2>
        <p className="font-mono text-xs" data-visitor={visitor.id}>
          {shortVisitorCode(visitor.id)}
        </p>
      </div>

      <dl
        className="grid gap-3 rounded-2xl border border-border bg-card p-4 text-sm sm:grid-cols-2 lg:grid-cols-3"
        data-purchase-amount={visitor.payAmount}
      >
        <Item label="첫 출처" value={sourceLabel(visitor.sourceKey, names)} />
        <Item label="처음" value={formatWhen(visitor.firstSeen)} />
        <Item label="마지막" value={formatWhen(visitor.lastSeen)} />
        <Item label="체류" value={visitor.dwellSeconds > 0 ? formatDuration(visitor.dwellSeconds) : "없음"} />
        <Item label="다시 방문" value={visitor.returned ? "예" : "아니오"} />
        <Item label="첫 구매하기" value={`${visitor.buyOpens}회`} />
        <Item label="구매 확정" value={`${visitor.buyClicks}회`} />
        <Item label="구매액" value={won(visitor.payAmount)} />
        <Item label="장바구니 담기" value={visitor.addedCart ? "예" : "아니오"} />
        <Item label="장바구니 입장" value={visitor.viewedCart ? "예" : "아니오"} />
        <Item label="수량" value={visitor.lastQty == null ? "없음" : String(visitor.lastQty)} />
        <Item label="후기" value={visitor.reviewClick ? "예" : "아니오"} />
      </dl>

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
              <TableRow key={item.id} data-timeline-step={item.step} data-amount={item.amount ?? ""}>
                <TableCell className="whitespace-nowrap">{formatWhen(item.createdAt)}</TableCell>
                <TableCell>{item.label}</TableCell>
                <TableCell>{item.detail || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  )
}
