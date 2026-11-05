import { CopyLink } from "@/components/dashboard/copy-link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { referrerLabel } from "@/lib/referrer"
import type { SourceStat } from "@/lib/stats"

export function SourceReport({
  rows,
  links,
  urls,
}: {
  rows: SourceStat[]
  links: { code: string; name: string }[]
  urls: { code: string; name: string; url: string }[]
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-serif text-2xl">어디서 왔나</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          기준 출처는 링크 코드가 있으면 그 코드이고, 없으면 리퍼러 분류입니다. 리퍼러가 없으면 직접/알 수
          없음으로 두며, 어느 사이트인지는 추정하지 않습니다.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">나눠 줄 주소</h3>
        <p className="text-sm text-muted-foreground">
          이 네 주소는 같은 홈으로 들어가고 진열 가격은 바꾸지 않습니다. 구글은 검색어를 저장하지 않고 구글
          검색으로만 구분합니다.
        </p>
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
          {urls.map((item) => (
            <li
              key={item.code}
              className="flex flex-col gap-2 bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {item.name}
                  <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">link={item.code}</span>
                </p>
                <p className="break-all font-mono text-xs text-muted-foreground">{item.url}</p>
              </div>
              <CopyLink url={item.url} />
            </li>
          ))}
        </ul>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-6 py-8 text-sm text-muted-foreground">
          아직 방문이 없습니다. 직접 나눠 주는 주소는 링크 코드로 구분하고, 코드를 붙이지 않은 유입은 브라우저가
          보낸 리퍼러로 나눕니다.
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            같은 방문에 링크 코드와 리퍼러가 같이 있으면 기준 출처는 링크 코드입니다. 두 값은 각 칸에 그대로
            둡니다.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>기준 출처</TableHead>
                <TableHead>링크 코드</TableHead>
                <TableHead>리퍼러</TableHead>
                <TableHead className="text-right">방문</TableHead>
                <TableHead className="text-right">상품 상세</TableHead>
                <TableHead className="text-right">구매 버튼</TableHead>
                <TableHead className="text-right">결제 페이지</TableHead>
                <TableHead className="text-right">결제 버튼</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const known = links.find((link) => link.code === row.linkCode)
                const primary = row.linkCode ? known?.name || row.linkCode : referrerLabel(row.referrerClass)
                return (
                  <TableRow key={`${row.linkCode}:${row.referrerClass}`} data-source-row={`${row.linkCode}|${row.referrerClass}`}>
                    <TableCell>{primary}</TableCell>
                    <TableCell className="font-mono text-xs">{row.linkCode || "없음"}</TableCell>
                    <TableCell>{referrerLabel(row.referrerClass)}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.visits}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.productViews}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.buyClicks}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.checkoutViews}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.payClicks}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  )
}
