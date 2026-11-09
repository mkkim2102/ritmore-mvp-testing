import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { customerFacingTinName, tinCountForSlug } from "@/lib/bundles"
import { listProducts } from "@/lib/catalog"
import { formatDuration, formatWhen, shortVisitorCode, won } from "@/lib/format"
import { STEP_LABEL } from "@/lib/funnel"
import { confirmedBuys, linkNames, listVisitorRollups, sourceLabel, type VisitorRollup } from "@/lib/journey"
import { referrerLabel } from "@/lib/referrer"
import { cn } from "@/lib/utils"

export const metadata = { title: "방문자" }

const PAGE_SIZE = 30

type CustomerSearch = Record<string, string | string[] | undefined>

const ACTION_FILTERS: {
  id: string
  label: string
  match: (row: VisitorRollup) => boolean
}[] = [
  { id: "visit", label: STEP_LABEL.visit, match: (row) => row.visited },
  { id: "product_view", label: STEP_LABEL.product_view, match: (row) => row.productView },
  { id: "buy_open", label: STEP_LABEL.buy_open, match: (row) => row.buyOpens > 0 },
  { id: "add_to_cart", label: STEP_LABEL.add_to_cart, match: (row) => row.addedCart },
  { id: "cart_view", label: STEP_LABEL.cart_view, match: (row) => row.viewedCart },
  { id: "buy_click", label: STEP_LABEL.buy_click, match: (row) => row.buyClicks > 0 },
  { id: "checkout_view", label: STEP_LABEL.checkout_view, match: (row) => row.checkoutView },
  { id: "pay_click", label: STEP_LABEL.pay_click, match: (row) => row.payClick },
  { id: "review_click", label: STEP_LABEL.review_click, match: (row) => row.reviewClick },
  { id: "return", label: STEP_LABEL.return, match: (row) => row.returned },
]

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<CustomerSearch>
}) {
  const query = await searchParams
  const names = linkNames()
  const rows = listVisitorRollups()
  const products = listProducts(true)
  const actionId = firstQuery(query.action)
  const optionId = firstQuery(query.option)
  const routeId = firstQuery(query.route)
  const action = ACTION_FILTERS.find((item) => item.id === actionId) ?? null
  const buys = new Map<string, string[]>()
  const buyersByProduct = new Map<string, Set<string>>()
  for (const buy of confirmedBuys()) {
    const product = products.find((item) => item.id === buy.product_id)
    const label = product ? customerFacingTinName(product.name, product.slug) : buy.product_id
    const line = `${label} ${buy.qty}개 ${won(buy.amount)}`
    const list = buys.get(buy.visitor_id) ?? []
    list.push(line)
    buys.set(buy.visitor_id, list)
    const buyers = buyersByProduct.get(buy.product_id) ?? new Set<string>()
    buyers.add(buy.visitor_id)
    buyersByProduct.set(buy.product_id, buyers)
  }
  const options = optionChoices(buyersByProduct, products, optionId)
  const selectedOption = optionId ? options.find((item) => item.id === optionId) ?? null : null
  const routes = routeChoices(rows, names)
  const selectedRoute = routeId ? routes.find((item) => item.id === routeId) ?? null : null
  const routeLabel = routeId ? (selectedRoute?.label ?? labelForRoute(routeId, names)) : null
  const filtered = rows.filter((row) => {
    if (action && !action.match(row)) return false
    if (optionId && !buyersByProduct.get(optionId)?.has(row.id)) return false
    if (routeId && row.sourceKey !== routeId) return false
    return true
  })
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page = clampPage(query.page, pageCount)
  const start = (page - 1) * PAGE_SIZE
  const visible = filtered.slice(start, start + PAGE_SIZE)
  const scope = scopeSentence(action?.label ?? null, selectedOption?.label ?? (optionId || null), routeLabel)
  const linkQuery: CustomerSearch = {
    ...query,
    action: action?.id,
    option: optionId || undefined,
    route: routeId || undefined,
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl">방문자</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          브라우저에 남긴 방문자 번호만 보여 줍니다. 이름과 전화번호는 저장하지 않습니다. 미리보기 방문은 빠집니다.
          구매 확정 금액은 고른 옵션의 실판매가에 수량을 곱한 합입니다. 결제 금액은 결제 버튼을 누른 합입니다.
          이 목록은 요약입니다. 방문자 번호나 세부 보기를 누르면 그 방문자의 들어온 시각, 구매 확정 시각, 행동 시각을 볼 수 있습니다. 한 페이지에 30명씩 보여 줍니다.
          행동을 고르면 그 항목을 한 사람만 볼 수 있습니다.
        </p>
      </div>

      <VisitorFilters
        query={linkQuery}
        actionId={action?.id ?? null}
        optionId={selectedOption?.id ?? null}
        routeId={routeId || null}
        options={options}
        routes={routes}
        scope={scope}
      />

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
          아직 방문자가 없습니다.
        </p>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground" data-empty="filter">
          {emptyFilterSentence(action?.label ?? null, selectedOption?.label ?? optionId, routeLabel)}
        </p>
      ) : (
        <>
        <Pager page={page} pageCount={pageCount} from={start + 1} to={start + visible.length} total={filtered.length} query={linkQuery} />
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>방문자</TableHead>
                <TableHead>세부</TableHead>
                <TableHead>첫 출처</TableHead>
                <TableHead>처음</TableHead>
                <TableHead>마지막</TableHead>
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
              {visible.map((row) => {
                const href = detailHref(row.id, page, linkQuery)
                const code = shortVisitorCode(row.id)
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
                  >
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      <Link href={href} className="underline underline-offset-2" aria-label={`${code} 세부 보기`}>
                        {code}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={href} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                        세부 보기
                      </Link>
                    </TableCell>
                    <TableCell>
                      {sourceLabel(row.sourceKey, names)}
                      {row.linkCode ? <span className="block font-mono text-xs text-muted-foreground">{row.linkCode}</span> : null}
                      <span className="block text-xs text-muted-foreground">{referrerLabel(row.referrerClass)}</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatWhen(row.firstSeen)}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatWhen(row.lastSeen)}</TableCell>
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
        <Pager page={page} pageCount={pageCount} from={start + 1} to={start + visible.length} total={filtered.length} query={linkQuery} />
        </>
      )}
    </div>
  )
}

function detailHref(id: string, page: number, query: CustomerSearch) {
  return customerHref(`/dashboard/customers/${id}`, page, query)
}

function VisitorFilters({
  query,
  actionId,
  optionId,
  routeId,
  options,
  routes,
  scope,
}: {
  query: CustomerSearch
  actionId: string | null
  optionId: string | null
  routeId: string | null
  options: OptionChoice[]
  routes: RouteChoice[]
  scope: string
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">행동</p>
        <div className="flex flex-wrap gap-2" role="navigation" aria-label="행동">
          <FilterLink href={filterHref(query, { action: null, option: optionId, route: routeId })} active={!actionId}>
            전체
          </FilterLink>
          {ACTION_FILTERS.map((item) => (
            <FilterLink
              key={item.id}
              href={filterHref(query, { action: item.id, option: optionId, route: routeId })}
              active={actionId === item.id}
            >
              {item.label}
            </FilterLink>
          ))}
        </div>
      </div>
      {options.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">확정한 옵션</p>
          <div className="flex flex-wrap gap-2" role="navigation" aria-label="확정한 옵션">
            <FilterLink href={filterHref(query, { action: actionId, option: null, route: routeId })} active={!optionId}>
              전체
            </FilterLink>
            {options.map((item) => (
              <FilterLink
                key={item.id}
                href={filterHref(query, { action: actionId, option: item.id, route: routeId })}
                active={optionId === item.id}
              >
                {item.label}
              </FilterLink>
            ))}
          </div>
        </div>
      ) : null}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">들어온 경로</p>
        <div className="flex flex-wrap gap-2" role="navigation" aria-label="들어온 경로">
          <FilterLink href={filterHref(query, { action: actionId, option: optionId, route: null })} active={!routeId}>
            전체
          </FilterLink>
          {routes.map((item) => (
            <FilterLink
              key={item.id}
              href={filterHref(query, { action: actionId, option: optionId, route: item.id })}
              active={routeId === item.id}
            >
              {item.label}
            </FilterLink>
          ))}
        </div>
      </div>
      <p
        className="text-sm"
        data-active-filter={actionId || "all"}
        data-active-option={optionId || "all"}
        data-active-route={routeId || "all"}
      >
        {scope}
      </p>
    </div>
  )
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        buttonVariants({ variant: active ? "default" : "outline", size: "sm" }),
        "h-auto min-h-7 max-w-full whitespace-normal py-1 text-center",
      )}
    >
      {children}
    </Link>
  )
}

type OptionChoice = { id: string; label: string; count: number | null }

function optionChoices(
  buyersByProduct: Map<string, Set<string>>,
  products: ReturnType<typeof listProducts>,
  selectedId: string,
): OptionChoice[] {
  const ids = [...buyersByProduct.keys()]
  if (selectedId && !buyersByProduct.has(selectedId)) ids.push(selectedId)
  return ids
    .filter(Boolean)
    .map((id) => {
      const product = products.find((item) => item.id === id)
      return {
        id,
        label: product ? customerFacingTinName(product.name, product.slug) : id,
        count: product ? tinCountForSlug(product.slug) : null,
      }
    })
    .sort((a, b) => (a.count ?? 999) - (b.count ?? 999) || a.label.localeCompare(b.label, "ko"))
}

type RouteChoice = { id: string; label: string }

function routeChoices(rows: VisitorRollup[], names: Map<string, string>): RouteChoice[] {
  const ids = new Set<string>()
  for (const row of rows) {
    if (row.sourceKey) ids.add(row.sourceKey)
  }
  return [...ids]
    .map((id) => ({ id, label: sourceLabel(id, names) }))
    .sort((a, b) => a.label.localeCompare(b.label, "ko") || a.id.localeCompare(b.id))
}

function labelForRoute(key: string, names: Map<string, string>) {
  if (key.startsWith("link:") || key.startsWith("ref:")) return sourceLabel(key, names)
  return key
}

function scopeSentence(actionLabel: string | null, optionLabel: string | null, routeLabel: string | null) {
  if (!routeLabel) {
    if (actionLabel && optionLabel) {
      return `「${actionLabel}」 항목을 하고 확정한 옵션 「${optionLabel}」${eulReul(optionLabel)} 고른 방문자만 보여 줍니다.`
    }
    if (actionLabel) return `「${actionLabel}」 항목을 한 방문자만 보여 줍니다.`
    if (optionLabel) return `확정한 옵션 「${optionLabel}」${eulReul(optionLabel)} 고른 방문자만 보여 줍니다.`
    return "전체 방문자를 보여 줍니다."
  }
  const via = `들어온 경로 「${routeLabel}」${euro(routeLabel)} 들어온`
  if (actionLabel && optionLabel) {
    return `「${actionLabel}」 항목을 하고 확정한 옵션 「${optionLabel}」${eulReul(optionLabel)} 고르고 ${via} 방문자만 보여 줍니다.`
  }
  if (actionLabel) return `「${actionLabel}」 항목을 하고 ${via} 방문자만 보여 줍니다.`
  if (optionLabel) return `확정한 옵션 「${optionLabel}」${eulReul(optionLabel)} 고르고 ${via} 방문자만 보여 줍니다.`
  return `${via} 방문자만 보여 줍니다.`
}

function emptyFilterSentence(actionLabel: string | null, optionLabel: string | null, routeLabel: string | null) {
  if (!routeLabel) {
    if (actionLabel && optionLabel) {
      return `「${actionLabel}」 항목을 하고 확정한 옵션 「${optionLabel}」${eulReul(optionLabel)} 고른 방문자가 없습니다.`
    }
    if (actionLabel) return `「${actionLabel}」 항목을 한 방문자가 없습니다.`
    if (optionLabel) return `확정한 옵션 「${optionLabel}」${eulReul(optionLabel)} 고른 방문자가 없습니다.`
    return "조건에 맞는 방문자가 없습니다."
  }
  const via = `들어온 경로 「${routeLabel}」${euro(routeLabel)} 들어온`
  if (actionLabel && optionLabel) {
    return `「${actionLabel}」 항목을 하고 확정한 옵션 「${optionLabel}」${eulReul(optionLabel)} 고르고 ${via} 방문자가 없습니다.`
  }
  if (actionLabel) return `「${actionLabel}」 항목을 하고 ${via} 방문자가 없습니다.`
  if (optionLabel) return `확정한 옵션 「${optionLabel}」${eulReul(optionLabel)} 고르고 ${via} 방문자가 없습니다.`
  return `${via} 방문자가 없습니다.`
}

function eulReul(word: string) {
  const last = word.charCodeAt(word.length - 1)
  if (!Number.isFinite(last) || last < 0xac00 || last > 0xd7a3) return "를"
  return (last - 0xac00) % 28 === 0 ? "를" : "을"
}

function euro(word: string) {
  const last = word.charCodeAt(word.length - 1)
  if (!Number.isFinite(last) || last < 0xac00 || last > 0xd7a3) return "로"
  const jong = (last - 0xac00) % 28
  return jong === 0 || jong === 8 ? "로" : "으로"
}

function filterHref(
  current: CustomerSearch,
  next: { action: string | null; option: string | null; route: string | null },
) {
  const query: CustomerSearch = {
    ...current,
    action: next.action || undefined,
    option: next.option || undefined,
    route: next.route || undefined,
  }
  return customerHref("/dashboard/customers", 1, query)
}

function firstQuery(raw: string | string[] | undefined) {
  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? ""
  return value
}

function Pager({
  page,
  pageCount,
  from,
  to,
  total,
  query,
}: {
  page: number
  pageCount: number
  from: number
  to: number
  total: number
  query: CustomerSearch
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-muted-foreground tabular-nums" data-page={page} data-page-count={pageCount}>
        {from}–{to} / {total}
      </p>
      <div className="flex flex-wrap gap-2">
        <PageLink href={customerHref("/dashboard/customers", page - 1, query)} disabled={page <= 1}>
          이전
        </PageLink>
        <PageLink href={customerHref("/dashboard/customers", page + 1, query)} disabled={page >= pageCount}>
          다음
        </PageLink>
      </div>
    </div>
  )
}

function PageLink({ href, disabled, children }: { href: string; disabled: boolean; children: string }) {
  if (disabled) {
    return (
      <span className={cn(buttonVariants({ variant: "outline", size: "sm" }), "pointer-events-none opacity-50")} aria-disabled="true">
        {children}
      </span>
    )
  }
  return (
    <Link href={href} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
      {children}
    </Link>
  )
}

function clampPage(raw: string | string[] | undefined, pageCount: number) {
  const value = Array.isArray(raw) ? raw[0] : raw
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return 1
  return Math.min(Math.floor(parsed), pageCount)
}

function customerHref(path: string, page: number, current: CustomerSearch) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(current)) {
    if (key === "page" || value == null) continue
    const values = Array.isArray(value) ? value : [value]
    for (const item of values) params.append(key, item)
  }
  if (page > 1) params.set("page", String(page))
  const search = params.toString()
  return search ? `${path}?${search}` : path
}
