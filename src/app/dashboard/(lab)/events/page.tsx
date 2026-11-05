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
import { channelLabel } from "@/lib/channels"
import { STEP_LABEL } from "@/lib/funnel"
import { referrerLabel } from "@/lib/referrer"
import { formatWhen, won } from "@/lib/format"
import { readFilters, recentEvents } from "@/lib/stats"

export const metadata = { title: "기록" }

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
      {events.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
          이 조건에 해당하는 기록이 없습니다.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>시각</TableHead>
              <TableHead>단계</TableHead>
              <TableHead>링크</TableHead>
              <TableHead>리퍼러</TableHead>
              <TableHead>상품</TableHead>
              <TableHead className="text-right">가격</TableHead>
              <TableHead>세션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => {
              const link = links.find((item) => item.code === event.linkCode)
              const product = products.find((item) => item.id === event.productId)
              const variant = variants.find((item) => item.id === event.variantId)
              return (
                <TableRow key={event.id}>
                  <TableCell className="whitespace-nowrap">{formatWhen(event.createdAt)}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      {STEP_LABEL[event.step] || event.step}
                      {event.preview ? <Badge variant="outline">미리보기</Badge> : null}
                    </span>
                  </TableCell>
                  <TableCell>
                    {link?.name || event.linkCode || "코드 없음"}
                    <span className="block text-xs text-muted-foreground">{channelLabel(event.channel)}</span>
                  </TableCell>
                  <TableCell>{referrerLabel(event.referrerClass)}</TableCell>
                  <TableCell>
                    {product?.name || "—"}
                    {variant ? <span className="block text-xs text-muted-foreground">{variant.label}</span> : null}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{event.price != null ? won(event.price) : "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{event.sessionId.slice(0, 8)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
