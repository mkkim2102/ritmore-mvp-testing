import { headers } from "next/headers"
import { Filters } from "@/components/dashboard/filters"
import { SourceReport } from "@/components/dashboard/source-report"
import { TrialLinks } from "@/components/dashboard/trial-links"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getProductById, getVariant, listLinks } from "@/lib/catalog"
import { channelLabel } from "@/lib/channels"
import { STEP_LABEL } from "@/lib/funnel"
import { rate, requestOrigin, sourceLinkUrl, won } from "@/lib/format"
import { SOURCE_LINKS } from "@/lib/referrer"
import { funnelCounts, linkStats, readFilters, sideCounts, sourceStats, variantStats } from "@/lib/stats"

export const metadata = { title: "퍼널 요약" }

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; link?: string; channel?: string; preview?: string }>
}) {
  const filters = readFilters(await searchParams)
  const funnel = funnelCounts(filters)
  const side = sideCounts(filters)
  const links = listLinks()
  const byLink = linkStats(filters)
  const byVariant = variantStats(filters)
  const bySource = sourceStats(filters)
  const headerList = await headers()
  const origin = requestOrigin(headerList)
  const sourceUrls = SOURCE_LINKS.map((link) => ({
    code: link.code,
    name: link.name,
    url: sourceLinkUrl(headerList, link.code),
  }))
  const visits = funnel[0]?.sessions ?? 0
  const max = Math.max(...funnel.map((step) => step.sessions), 1)
  const channels = [...new Set(links.map((link) => link.channel))]

  return (
    <div className="space-y-8">
      <Filters
        filters={filters}
        links={links.map((link) => ({ code: link.code, name: link.name }))}
        channels={channels.map((channel) => ({ id: channel, label: channelLabel(channel) }))}
      />

      <SourceReport
        rows={bySource}
        links={links.map((link) => ({ code: link.code, name: link.name }))}
        urls={sourceUrls}
      />

      {visits === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>아직 집계할 방문이 없습니다</CardTitle>
            <CardDescription>
              아래 주소로 들어가 상품을 보고 결제 버튼까지 누르면, 링크마다 숫자가 갈라집니다. 미리보기는
              기본 집계에서 빠집니다. 실제 시험 주소에는 preview가 없습니다.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {funnel
              .filter((step) =>
                ["visit", "product_view", "buy_open", "buy_click", "cart_view", "pay_click"].includes(step.step),
              )
              .map((step) => (
                <Card key={step.step} size="sm">
                  <CardHeader>
                    <CardDescription>{STEP_LABEL[step.step]}</CardDescription>
                    <CardTitle className="font-sans text-3xl tabular-nums">{step.sessions}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    방문 대비 {rate(step.sessions, visits)}
                  </CardContent>
                </Card>
              ))}
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="font-serif text-2xl">퍼널</h2>
              <p className="text-sm text-muted-foreground">
                각 칸은 그 단계에 도달한 세션 수입니다. 목록을 건너뛰고 상세로 들어온 방문은 목록에 포함되지
                않습니다. 장바구니에 담은 세션은 {side.addToCart}입니다. 장바구니 입장은 {side.cartViews}입니다.
              </p>
            </div>
            <div className="space-y-4">
              {funnel.map((step, index) => {
                const previous = index === 0 ? step.sessions : funnel[index - 1].sessions
                return (
                  <div key={step.step} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <p>{STEP_LABEL[step.step]}</p>
                      <p className="tabular-nums">
                        {step.sessions}
                        <span className="ml-2 text-muted-foreground">이전 대비 {rate(step.sessions, previous)}</span>
                      </p>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.max(4, (step.sessions / max) * 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-2xl">링크</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>링크</TableHead>
                  <TableHead>채널</TableHead>
                  <TableHead className="text-right">방문</TableHead>
                  <TableHead className="text-right">상세</TableHead>
                  <TableHead className="text-right">구매</TableHead>
                  <TableHead className="text-right">결제 페이지</TableHead>
                  <TableHead className="text-right">결제 클릭</TableHead>
                  <TableHead className="text-right">방문 대비 결제</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byLink.map((row) => {
                  const known = links.find((link) => link.code === row.linkCode)
                  return (
                    <TableRow key={row.linkCode || "none"}>
                      <TableCell>{known?.name || row.linkCode || "코드 없음"}</TableCell>
                      <TableCell>{channelLabel(row.channel)}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.visits}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.productViews}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.buyClicks}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.checkoutViews}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.payClicks}</TableCell>
                      <TableCell className="text-right tabular-nums">{rate(row.payClicks, row.visits)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-2xl">가격안</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>상품</TableHead>
                  <TableHead>가격안</TableHead>
                  <TableHead className="text-right">보인 가격</TableHead>
                  <TableHead className="text-right">상세</TableHead>
                  <TableHead className="text-right">구매</TableHead>
                  <TableHead className="text-right">결제 클릭</TableHead>
                  <TableHead className="text-right">상세 대비 결제</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byVariant.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>상품 상세 기록이 없습니다.</TableCell>
                  </TableRow>
                ) : (
                  byVariant.map((row) => {
                    const product = getProductById(row.productId)
                    const variant = row.variantId ? getVariant(row.variantId) : null
                    return (
                      <TableRow key={`${row.productId}-${row.variantId}`}>
                        <TableCell>{product?.name || row.productId}</TableCell>
                        <TableCell>{variant ? `${variant.label}` : "기본가"}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.price != null ? won(row.price) : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{row.productViews}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.buyClicks}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.payClicks}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {rate(row.payClicks, row.productViews)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </section>
        </>
      )}

      <section className="space-y-3">
        <h2 className="font-serif text-2xl">시험으로 열 주소</h2>
        <TrialLinks origin={origin} links={links} />
      </section>
    </div>
  )
}
