import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDuration, formatWhen, shortVisitorCode, won } from "@/lib/format"
import { linkNames, listVisitorRollups, sourceLabel } from "@/lib/journey"

export const metadata = { title: "방문자" }

export default function CustomersPage() {
  const names = linkNames()
  const rows = listVisitorRollups()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl">방문자</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          브라우저에 남긴 방문자 번호만 보여 줍니다. 이름과 전화번호는 저장하지 않습니다. 미리보기 방문은 빠집니다.
          구매액은 그 방문자의 결제 금액을 더한 값입니다.
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
                <TableHead className="text-right">체류</TableHead>
                <TableHead>다시 방문</TableHead>
                <TableHead className="text-right">첫 구매하기</TableHead>
                <TableHead className="text-right">구매 확정</TableHead>
                <TableHead className="text-right">구매액</TableHead>
                <TableHead>장바구니 담기</TableHead>
                <TableHead>장바구니 입장</TableHead>
                <TableHead className="text-right">수량</TableHead>
                <TableHead>후기</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-visitor={row.id}
                  data-source={row.sourceKey}
                  data-buy-opens={row.buyOpens}
                  data-buys={row.buyClicks}
                  data-purchase-amount={row.payAmount}
                  data-cart={row.addedCart ? "yes" : "no"}
                  data-cart-view={row.viewedCart ? "yes" : "no"}
                  data-review={row.reviewClick ? "yes" : "no"}
                  data-qty={row.lastQty ?? ""}
                  data-returned={row.returned ? "yes" : "no"}
                  data-dwell={row.dwellSeconds}
                >
                  <TableCell className="font-mono text-xs">
                    <Link href={`/dashboard/customers/${row.id}`} className="underline-offset-2 hover:underline">
                      {shortVisitorCode(row.id)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {sourceLabel(row.sourceKey, names)}
                    {row.linkCode ? <span className="block font-mono text-xs text-muted-foreground">{row.linkCode}</span> : null}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatWhen(row.firstSeen)}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatWhen(row.lastSeen)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {row.dwellSeconds > 0 ? formatDuration(row.dwellSeconds) : "없음"}
                  </TableCell>
                  <TableCell>{row.returned ? "예" : "아니오"}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.buyOpens}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.buyClicks}</TableCell>
                  <TableCell className="text-right tabular-nums whitespace-nowrap">{won(row.payAmount)}</TableCell>
                  <TableCell>{row.addedCart ? "예" : "아니오"}</TableCell>
                  <TableCell>{row.viewedCart ? "예" : "아니오"}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.lastQty == null ? "없음" : row.lastQty}</TableCell>
                  <TableCell>{row.reviewClick ? "예" : "아니오"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
