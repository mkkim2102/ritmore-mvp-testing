import { Filters } from "@/components/dashboard/filters"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { listLinks, listProducts, listVariants } from "@/lib/catalog"
import { customerFacingTinName } from "@/lib/bundles"
import { channelLabel } from "@/lib/channels"
import { STEP_LABEL } from "@/lib/funnel"
import { referrerLabel } from "@/lib/referrer"
import { formatWhen, shortVisitorCode, won } from "@/lib/format"
import { eventPurchaseAmount } from "@/lib/journey"
import { readFilters, recentEvents } from "@/lib/stats"

export const metadata = { title: "기록" }

function shown(value: string) {
  return value || "—"
}

function metaText(raw: string) {
  if (!raw) return "—"
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const parts: string[] = []
    if (typeof parsed.page === "string") parts.push(parsed.page)
    if (typeof parsed.seconds === "number") parts.push(`${parsed.seconds}초`)
    if (typeof parsed.method === "string") parts.push(parsed.method)
    if (typeof parsed.nameFilled === "boolean") parts.push(parsed.nameFilled ? "이름 입력" : "이름 없음")
    if (typeof parsed.phoneFilled === "boolean") parts.push(parsed.phoneFilled ? "전화 입력" : "전화 없음")
    return parts.length > 0 ? parts.join(" · ") : raw
  } catch {
    return raw
  }
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; link?: string; channel?: string; preview?: string }>
}) {
  const filters = readFilters(await searchParams)
  const events = recentEvents(filters)
  const links = listLinks()
  const products = listProducts(true)
  const variants = listVariants()
  const channels = [...new Set(links.map((link) => link.channel))]

  return (
    <div className="space-y-6">
      <Filters
        filters={filters}
        links={links.map((link) => ({ code: link.code, name: link.name }))}
        channels={channels.map((channel) => ({ id: channel, label: channelLabel(channel) }))}
      />
      <p className="text-sm text-muted-foreground">최근 80건입니다. 저장된 칸을 모두 보여 줍니다.</p>
      {events.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
          이 조건에 해당하는 기록이 없습니다.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>시각</TableHead>
                <TableHead>단계</TableHead>
                <TableHead>방문자</TableHead>
                <TableHead>경로</TableHead>
                <TableHead>링크</TableHead>
                <TableHead>채널</TableHead>
                <TableHead>소스</TableHead>
                <TableHead>매체</TableHead>
                <TableHead>캠페인</TableHead>
                <TableHead>콘텐츠</TableHead>
                <TableHead>리퍼러</TableHead>
                <TableHead>상품</TableHead>
                <TableHead>실험</TableHead>
                <TableHead className="text-right">수량</TableHead>
                <TableHead className="text-right">단가</TableHead>
                <TableHead className="text-right">합계</TableHead>
                <TableHead>추가 기록</TableHead>
                <TableHead>세션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => {
                const link = links.find((item) => item.code === event.linkCode)
                const product = products.find((item) => item.id === event.productId)
                const variant = variants.find((item) => item.id === event.variantId)
                const total = eventPurchaseAmount(event.step, event.price, event.qty)
                return (
                  <TableRow key={event.id}>
                    <TableCell className="whitespace-nowrap">{formatWhen(event.createdAt)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        {STEP_LABEL[event.step] || event.step}
                        {event.preview ? <Badge variant="outline">미리보기</Badge> : null}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{shortVisitorCode(event.visitorId)}</TableCell>
                    <TableCell className="max-w-48 font-mono text-xs break-all">{shown(event.path)}</TableCell>
                    <TableCell>
                      {link?.name || event.linkCode || "코드 없음"}
                      {event.linkCode ? <span className="block font-mono text-xs text-muted-foreground">{event.linkCode}</span> : null}
                    </TableCell>
                    <TableCell>{channelLabel(event.channel)}</TableCell>
                    <TableCell>{shown(event.source)}</TableCell>
                    <TableCell>{shown(event.medium)}</TableCell>
                    <TableCell>{shown(event.campaign)}</TableCell>
                    <TableCell>{shown(event.content)}</TableCell>
                    <TableCell className="max-w-56">
                      <span className="block">{referrerLabel(event.referrerClass)}</span>
                      {event.referrer ? <span className="block text-xs break-all text-muted-foreground">{event.referrer}</span> : null}
                    </TableCell>
                    <TableCell>
                      {product ? customerFacingTinName(product.name, product.slug) : "—"}
                      {variant ? <span className="block text-xs text-muted-foreground">{variant.label}</span> : null}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{shown(event.experimentId)}</TableCell>
                    <TableCell className="text-right tabular-nums">{event.qty ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{event.price != null ? won(event.price) : "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{total != null ? won(total) : "—"}</TableCell>
                    <TableCell className="max-w-56 text-xs">{metaText(event.meta)}</TableCell>
                    <TableCell className="font-mono text-xs">{event.sessionId.slice(0, 8)}</TableCell>
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
