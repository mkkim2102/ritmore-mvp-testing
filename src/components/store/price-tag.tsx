import { discountRate, won } from "@/lib/format"
import { clampQty } from "@/lib/qty"
import { cn } from "@/lib/utils"

const SELLING_CLASS = {
  md: "text-lg font-semibold tabular-nums",
  card: "text-base font-semibold tabular-nums",
  lg: "text-4xl font-semibold tabular-nums",
  total: "text-2xl font-bold tabular-nums lg:text-3xl",
  rail: "text-2xl font-bold tabular-nums",
  bar: "text-base font-semibold leading-none tabular-nums text-[#111111]",
  sheet: "text-xl font-bold tabular-nums",
  unit: "text-base font-semibold tabular-nums",
} as const

export function PriceTag({
  price,
  compareAt,
  qty = 1,
  size = "md",
  align = "start",
  mark,
  sellingLabel = "할인가",
}: {
  price: number
  compareAt?: number | null
  qty?: number
  size?: keyof typeof SELLING_CLASS
  align?: "start" | "end"
  mark?: "unit" | "total"
  sellingLabel?: string
}) {
  const count = clampQty(qty)
  const selling = price * count
  const rate = discountRate(compareAt, price)
  const list = compareAt != null ? compareAt * count : null
  const showPriceLabels = size !== "rail"
  const listClass =
    size === "card" || size === "bar"
      ? "text-[11px] text-muted-foreground"
      : size === "rail"
        ? "text-xs text-muted-foreground"
        : "text-sm text-muted-foreground"
  const rateClass =
    size === "rail"
      ? "text-base font-semibold tabular-nums text-[#e10600]"
      : size === "lg" || size === "total"
        ? "text-lg font-semibold tabular-nums text-[#e10600]"
        : "text-sm font-semibold tabular-nums text-[#e10600]"

  return (
    <p
      data-price-trio
      className={cn(
        "flex flex-wrap items-baseline gap-x-2 gap-y-1",
        align === "end" && "justify-end text-right",
      )}
    >
      {list != null ? (
        <span className={listClass} data-list-price={list}>
          {showPriceLabels ? <span className="mr-1">정가</span> : null}
          <span className={rate != null ? "line-through tabular-nums" : "tabular-nums"}>{won(list)}</span>
        </span>
      ) : null}
      <span>
        {showPriceLabels ? (
          <span className="mr-1 text-xs text-muted-foreground">{sellingLabel}</span>
        ) : null}
        <span
          className={SELLING_CLASS[size]}
          data-selling-price={selling}
          data-buy-unit={mark === "unit" ? "" : undefined}
          data-buy-total={mark === "total" ? "" : undefined}
          aria-live={mark === "total" ? "polite" : undefined}
        >
          {won(selling)}
        </span>
      </span>
      {rate != null ? (
        <span className={rateClass} data-discount-rate={rate}>
          {`${rate}%`}
        </span>
      ) : null}
    </p>
  )
}
