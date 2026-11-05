"use client"

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { createPortal } from "react-dom"
import { buttonVariants } from "@/components/ui/button"
import {
  addCartQty,
  itemsQuery,
  readCart,
  removeCartItem,
  writeCart,
  type CartItem,
} from "@/components/store/cart-store"
import { won } from "@/lib/format"
import { JourneyStep, type JourneyName } from "@/components/store/journey-step"
import { PriceTag } from "@/components/store/price-tag"
import { packChoiceLabel, type TinChoice } from "@/lib/bundles"
import { MAX_QTY, clampQty } from "@/lib/qty"
import { cn } from "@/lib/utils"

/** Header wordmark fill (`public/brand/ritmore.svg`) and the brand-story navy `#17364A`. */
const brandNavyFill = "border-[#17364A] bg-[#17364A] text-white hover:bg-[#17364A]/90"

function remember(step: "buy_open" | "buy_click" | "add_to_cart", slug: string, qty: number) {
  const safeQty = clampQty(qty)
  void fetch("/api/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    keepalive: true,
    body: JSON.stringify({ step, path: window.location.pathname, productSlug: slug, qty: safeQty }),
  }).catch(() => undefined)
}

type BuyContextValue = {
  name: string
  qty: number
  setQty: (value: number | ((current: number) => number)) => void
  flavor: string
  setFlavor: (value: string) => void
  flavors: string[]
  compareAt: number | null
  price: number
  configurations: TinChoice[]
  configIndex: number
  setConfigIndex: (index: number, syncUrl?: boolean) => void
  packOnPage: boolean
  selectedSlug: string
  sheetOpen: boolean
  openSheet: () => void
  closeSheet: () => void
  optionsInSheet: boolean
  shippingNote: string | null
}

type StackLine = {
  slug: string
  label: string
  name: string
  qty: number
  price: number
  compareAt: number | null
}

const CART_SLUG = /^[a-z0-9][a-z0-9-]{0,79}$/

function sheetOptionName(item: TinChoice) {
  const count = Number(String(item.label).replace(/[^\d]/g, ""))
  if (Number.isFinite(count) && count > 0) return packChoiceLabel(count)
  return (item.label || item.name).trim()
}

function isStackChoice(line: StackLine | null): line is StackLine {
  return !!line && CART_SLUG.test(line.slug) && line.name.trim().length > 0 && line.qty >= 1 && Number.isFinite(line.price)
}

function choiceForSelection(
  configurations: TinChoice[],
  configIndex: number,
  qty: number,
  fallback: { slug: string; name: string; price: number; compareAt: number | null },
): StackLine | null {
  const adding = clampQty(qty)
  if (!Number.isFinite(adding) || adding < 1) return null
  if (configurations.length > 0) {
    const config = configurations[configIndex]
    if (!config) return null
    const name = sheetOptionName(config).trim()
    const line = {
      slug: config.slug,
      label: config.label,
      name,
      qty: adding,
      price: config.price,
      compareAt: config.compareAt,
    }
    return isStackChoice(line) ? line : null
  }
  const line = {
    slug: fallback.slug,
    label: "",
    name: fallback.name.trim(),
    qty: adding,
    price: fallback.price,
    compareAt: fallback.compareAt,
  }
  return isStackChoice(line) ? line : null
}

function stackLine(lines: StackLine[], choice: StackLine) {
  if (!isStackChoice(choice)) return lines
  const index = lines.findIndex((line) => line.slug === choice.slug)
  if (index < 0) return [...lines, { ...choice, name: choice.name.trim() }]
  return lines.map((line, lineIndex) =>
    lineIndex === index
      ? {
          ...line,
          label: choice.label,
          name: choice.name.trim(),
          price: choice.price,
          compareAt: choice.compareAt,
          qty: clampQty(line.qty + choice.qty),
        }
      : line,
  )
}

function linesFromCart(
  items: CartItem[],
  configurations: TinChoice[],
  fallback: { slug: string; name: string; price: number; compareAt: number | null },
) {
  const lines: StackLine[] = []
  for (const item of items) {
    const config = configurations.find((choice) => choice.slug === item.slug)
    const choice = config
      ? {
          slug: config.slug,
          label: config.label,
          name: sheetOptionName(config).trim(),
          qty: item.qty,
          price: config.price,
          compareAt: config.compareAt,
        }
      : configurations.length === 0 && item.slug === fallback.slug
        ? {
            slug: fallback.slug,
            label: "",
            name: fallback.name.trim(),
            qty: item.qty,
            price: fallback.price,
            compareAt: fallback.compareAt,
          }
        : null
    if (!isStackChoice(choice)) continue
    const index = lines.findIndex((line) => line.slug === choice.slug)
    if (index < 0) lines.push(choice)
    else lines[index] = { ...lines[index], qty: clampQty(lines[index].qty + choice.qty) }
  }
  return lines
}

function managedSlugs(configurations: TinChoice[], fallbackSlug: string) {
  const slugs = new Set<string>()
  for (const item of configurations) {
    if (CART_SLUG.test(item.slug)) slugs.add(item.slug)
  }
  if (slugs.size === 0 && CART_SLUG.test(fallbackSlug)) slugs.add(fallbackSlug)
  return slugs
}

function writeStackToCart(lines: StackLine[], managed: Set<string>) {
  let items = readCart()
  for (const slug of managed) items = removeCartItem(items, slug)
  for (const line of lines) {
    if (!isStackChoice(line)) continue
    items = addCartQty(items, line.slug, line.qty)
  }
  writeCart(items)
}

const BuyContext = createContext<BuyContextValue | null>(null)

function useBuy() {
  const value = useContext(BuyContext)
  if (!value) throw new Error("BuyPanel은 ProductBuyProvider 안에서만 쓸 수 있습니다.")
  return value
}

export function ProductBuyProvider({
  slug,
  name,
  price,
  compareAt,
  flavors = [],
  configurations = [],
  optionsInSheet = false,
  packOnPage = false,
  syncPackUrl = false,
  shippingNote = null,
  children,
}: {
  slug: string
  name: string
  price: number
  compareAt?: number | null
  flavors?: string[]
  configurations?: TinChoice[]
  optionsInSheet?: boolean
  packOnPage?: boolean
  syncPackUrl?: boolean
  shippingNote?: string | null
  children: ReactNode
}) {
  const router = useRouter()
  const configurationsRef = useRef(configurations)
  const pendingSlug = useRef<string | null>(null)
  const [qty, setQtyState] = useState(1)
  const [flavor, setFlavor] = useState(flavors[0] ?? "")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [configIndex, setConfigIndexState] = useState(() => configurations.findIndex((item) => item.slug === slug))
  const selected = configurations[configIndex] ?? null
  const activeSlug = selected?.slug ?? slug
  const activeName = selected?.name ?? name
  const activePrice = selected?.price ?? price
  const activeCompare = selected ? selected.compareAt : (compareAt ?? null)

  useEffect(() => {
    configurationsRef.current = configurations
  }, [configurations])

  useEffect(() => {
    if (pendingSlug.current && pendingSlug.current !== slug) return
    pendingSlug.current = null
    const found = configurationsRef.current.findIndex((item) => item.slug === slug)
    setConfigIndexState((current) => (current === found ? current : found))
  }, [slug])

  const pendingQtyReady = useRef(false)
  useEffect(() => {
    if (!pendingQtyReady.current) {
      pendingQtyReady.current = true
      return
    }
    setQtyState(1)
  }, [configIndex])

  const openSheet = useCallback(() => {
    setSheetOpen(true)
    remember("buy_open", activeSlug, qty)
  }, [activeSlug, qty])
  const closeSheet = useCallback(() => setSheetOpen(false), [])
  const setConfigIndex = useCallback(
    (index: number, syncUrl = true) => {
      const list = configurationsRef.current
      if (!Number.isInteger(index) || index < 0 || index >= list.length) return
      if (index !== configIndex) setQtyState(1)
      setConfigIndexState(index)
      if (!syncUrl || !syncPackUrl || typeof window === "undefined") return
      const next = list[index]
      if (!next) return
      const url = new URL(window.location.href)
      url.pathname = `/products/${next.slug}`
      url.searchParams.delete("plan")
      const query = url.searchParams.toString()
      const href = query ? `${url.pathname}?${query}` : url.pathname
      if (`${window.location.pathname}${window.location.search}` === href) return
      pendingSlug.current = next.slug
      router.replace(href, { scroll: false })
    },
    [configIndex, router, syncPackUrl],
  )

  const value = useMemo<BuyContextValue>(() => {
    return {
      name: activeName,
      qty,
      setQty: (next) => {
        setQtyState((current) => {
          const resolved = typeof next === "function" ? next(current) : next
          return clampQty(resolved)
        })
      },
      flavor,
      setFlavor,
      flavors,
      compareAt: activeCompare,
      price: activePrice,
      configurations,
      configIndex,
      setConfigIndex,
      packOnPage,
      selectedSlug: activeSlug,
      sheetOpen,
      openSheet,
      closeSheet,
      optionsInSheet,
      shippingNote,
    }
  }, [
    activeCompare,
    activeName,
    activePrice,
    activeSlug,
    closeSheet,
    configIndex,
    configurations,
    flavor,
    flavors,
    openSheet,
    optionsInSheet,
    packOnPage,
    qty,
    shippingNote,
    setConfigIndex,
    sheetOpen,
  ])

  return (
    <BuyContext.Provider value={value}>
      {children}
      <BuySheet />
    </BuyContext.Provider>
  )
}

function FlavorChoices() {
  const { flavor, setFlavor, flavors } = useBuy()
  if (flavors.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {flavors.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setFlavor(item)}
          className={cn(
            "h-10 rounded-full border px-4 text-sm",
            flavor === item
              ? "border-[#111111] bg-[#111111] text-white"
              : "border-[#e5e5e5] bg-white text-[#111111]",
          )}
        >
          {item}
        </button>
      ))}
    </div>
  )
}

export function SelectedProductTitle() {
  const { name, configurations, configIndex } = useBuy()
  const label = configurations[configIndex]?.label ?? ""
  const base = (label ? name.replace(/\s+\d+(?:틴|개)$/, "") : name).replace(/^ritmore\s+/, "")
  const tinCount = Number(label.replace(/[^\d]/g, ""))
  const choice = Number.isFinite(tinCount) && tinCount > 0 ? packChoiceLabel(tinCount) : label
  return (
    <span data-product-title>
      <span className="font-normal">{base}</span>
      {choice ? (
        <span className="font-semibold" data-name-emphasis={label} data-tablet-count>
          {` ${choice}`}
        </span>
      ) : null}
    </span>
  )
}

function PackRow() {
  const { configurations, configIndex, setConfigIndex, packOnPage, selectedSlug } = useBuy()
  if (!packOnPage || configurations.length === 0) return null
  return (
    <div data-pack-row role="group" aria-label="구성" data-selected-slug={selectedSlug}>
      <div className="flex w-full min-w-0 gap-2">
        {configurations.map((item, index) => {
          const selected = index === configIndex
          return (
            <button
              key={item.slug}
              type="button"
              data-config={item.label}
              data-config-slug={item.slug}
              aria-pressed={selected}
              onClick={() => setConfigIndex(index)}
              className={cn(
                "h-11 min-w-0 flex-1 rounded-full border px-1 text-center text-sm",
                selected
                  ? cn(brandNavyFill, "font-medium")
                  : "border-[#e5e5e5] bg-white text-[#111111]",
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function QtyStepper() {
  const { qty, setQty } = useBuy()
  return (
    <div className="inline-flex items-center rounded-xl border border-[#e5e5e5] bg-white" data-qty-max={MAX_QTY}>
      <button
        type="button"
        className="h-11 w-11 text-lg disabled:opacity-30"
        onClick={() => setQty((value) => value - 1)}
        disabled={qty <= 1}
        aria-label="수량 줄이기"
      >
        −
      </button>
      <span className="w-10 text-center tabular-nums" data-qty>
        {qty}
      </span>
      <button
        type="button"
        className="h-11 w-11 text-lg disabled:opacity-30"
        onClick={() => setQty((value) => value + 1)}
        disabled={qty >= MAX_QTY}
        aria-label="수량 늘리기"
      >
        +
      </button>
    </div>
  )
}

export function OpenSheetButton({ className }: { className?: string }) {
  const { openSheet } = useBuy()
  return (
    <button type="button" className={className} onClick={openSheet}>
      구매하기
    </button>
  )
}

function ShippingNote({
  anchor = false,
  place,
  className,
}: {
  anchor?: boolean
  place: "panel" | "sheet"
  className?: string
}) {
  const { shippingNote } = useBuy()
  if (!shippingNote) return null
  return (
    <p
      id={anchor ? "shipping" : undefined}
      data-shipping-note={place}
      className={cn("text-sm leading-6 text-muted-foreground", className)}
    >
      {shippingNote}
    </p>
  )
}

export function BuyPanel({
  flowCta = false,
  shippingAnchor = false,
}: {
  flowCta?: boolean
  shippingAnchor?: boolean
}) {
  const { price, compareAt, openSheet, selectedSlug } = useBuy()

  return (
    <div data-buy-panel data-buy-slug={selectedSlug} className="min-w-0 space-y-4">
      <PriceTag price={price} compareAt={compareAt} size="total" />
      <PackRow />
      <div className="min-w-0 space-y-2">
        <button
          type="button"
          data-buy-cta={flowCta ? "flow" : undefined}
          className={cn(buttonVariants(), brandNavyFill, "h-12 w-full max-w-full text-base")}
          onClick={openSheet}
        >
          구매하기
        </button>
        <ShippingNote anchor={shippingAnchor} place="panel" />
      </div>
    </div>
  )
}

function SheetOptions() {
  const { configurations, configIndex, setConfigIndex, optionsInSheet } = useBuy()
  if (!optionsInSheet || configurations.length === 0) return null
  return (
    <div data-sheet-options role="radiogroup" aria-label="옵션">
      <p className="mb-2 text-sm text-[#111111]">옵션</p>
      <div className="space-y-2">
        {configurations.map((item, index) => {
          const selected = index === configIndex
          return (
            <button
              key={item.slug}
              type="button"
              role="radio"
              data-config={item.label}
              data-config-slug={item.slug}
              data-option-price={item.price}
              aria-checked={selected}
              onClick={() => setConfigIndex(index, false)}
              className={cn(
                "w-full min-w-0 rounded-xl border px-3 py-3 text-left",
                selected ? brandNavyFill : "border-[#e5e5e5] bg-white text-[#111111]",
              )}
            >
              <span className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span className="min-w-0 text-sm font-medium break-words">
                  {packChoiceLabel(Number(item.label.replace(/[^\d]/g, "")) || 1)}
                </span>
                <span className="ml-auto text-right">
                  {item.compareAt != null ? (
                    <span className={cn("block text-xs", selected ? "text-white/70" : "text-[#666666]")}>
                      <span className="mr-1">정가</span>
                      <span className="tabular-nums line-through">{won(item.compareAt)}</span>
                    </span>
                  ) : null}
                  <span className="block text-sm">
                    <span className={cn("mr-1 text-xs", selected ? "text-white/70" : "text-[#666666]")}>할인가</span>
                    <span className="font-semibold tabular-nums">{won(item.price)}</span>
                  </span>
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function LineQty({
  name,
  qty,
  onChange,
}: {
  name: string
  qty: number
  onChange: (qty: number) => void
}) {
  return (
    <div className="inline-flex items-center rounded-xl border border-[#e5e5e5] bg-white" data-qty-max={MAX_QTY}>
      <button
        type="button"
        className="h-9 w-9 text-lg disabled:opacity-30"
        onClick={() => onChange(qty - 1)}
        disabled={qty <= 1}
        aria-label={`${name} 수량 줄이기`}
      >
        −
      </button>
      <span className="w-8 text-center text-sm tabular-nums" data-line-qty>
        {qty}
      </span>
      <button
        type="button"
        className="h-9 w-9 text-lg disabled:opacity-30"
        onClick={() => onChange(qty + 1)}
        disabled={qty >= MAX_QTY}
        aria-label={`${name} 수량 늘리기`}
      >
        +
      </button>
    </div>
  )
}

function BuySheet() {
  const {
    name,
    qty,
    price,
    compareAt,
    configurations,
    configIndex,
    selectedSlug,
    sheetOpen,
    closeSheet,
  } = useBuy()
  const [lines, setLines] = useState<StackLine[]>([])
  const dirty = useRef(false)
  const snapRef = useRef({
    configurations,
    fallback: { slug: selectedSlug, name, price, compareAt },
  })
  useEffect(() => {
    snapRef.current = {
      configurations,
      fallback: { slug: selectedSlug, name, price, compareAt },
    }
  }, [compareAt, configurations, name, price, selectedSlug])

  const choice = choiceForSelection(configurations, configIndex, qty, {
    slug: selectedSlug,
    name,
    price,
    compareAt,
  })
  const totalQty = lines.reduce((sum, line) => sum + line.qty, 0)
  const total = lines.reduce((sum, line) => sum + line.price * line.qty, 0)
  const compareTotal =
    lines.length > 0 && lines.every((line) => line.compareAt != null)
      ? lines.reduce((sum, line) => sum + (line.compareAt ?? 0) * line.qty, 0)
      : null
  const projectHref =
    lines.length > 0 ? `/project?items=${itemsQuery(lines.map((line) => ({ slug: line.slug, qty: line.qty })))}` : ""

  useEffect(() => {
    if (!sheetOpen) return
    dirty.current = false
    const snap = snapRef.current
    setLines(linesFromCart(readCart(), snap.configurations, snap.fallback))
  }, [sheetOpen])

  useEffect(() => {
    if (!dirty.current) return
    dirty.current = false
    const snap = snapRef.current
    writeStackToCart(lines, managedSlugs(snap.configurations, snap.fallback.slug))
  }, [lines])

  useEffect(() => {
    if (!sheetOpen) return
    const html = document.documentElement
    const body = document.body
    const previous = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width,
    }
    const scrollY = window.scrollY
    html.style.overflow = "hidden"
    body.style.overflow = "hidden"
    body.style.position = "fixed"
    body.style.top = `-${scrollY}px`
    body.style.left = "0"
    body.style.right = "0"
    body.style.width = "100%"

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSheet()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      html.style.overflow = previous.htmlOverflow
      body.style.overflow = previous.bodyOverflow
      body.style.position = previous.bodyPosition
      body.style.top = previous.bodyTop
      body.style.left = previous.bodyLeft
      body.style.right = previous.bodyRight
      body.style.width = previous.bodyWidth
      window.removeEventListener("keydown", onKey)
      window.scrollTo(0, scrollY)
    }
  }, [closeSheet, sheetOpen])

  function addSelection() {
    const nextChoice = choiceForSelection(configurations, configIndex, qty, {
      slug: selectedSlug,
      name,
      price,
      compareAt,
    })
    if (!nextChoice) return
    dirty.current = true
    setLines((current) => stackLine(current, nextChoice))
    remember("add_to_cart", nextChoice.slug, nextChoice.qty)
  }

  function changeLineQty(slug: string, nextQty: number) {
    dirty.current = true
    setLines((current) =>
      current.map((line) => (line.slug === slug ? { ...line, qty: clampQty(nextQty) } : line)),
    )
  }

  function removeLine(slug: string) {
    dirty.current = true
    setLines((current) => current.filter((line) => line.slug !== slug))
  }

  if (!sheetOpen || typeof document === "undefined") return null

  return createPortal(
    <div className="fixed inset-0 z-50" data-buy-sheet>
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="구매 옵션 닫기"
        onClick={closeSheet}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="buy-sheet-title"
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 z-10 flex max-h-[100dvh] w-full min-w-0 flex-col overflow-hidden rounded-t-2xl bg-white text-[#111111] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] outline-none lg:inset-x-auto lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:w-[min(28rem,calc(100%-2rem))] lg:max-h-[min(40rem,calc(100dvh-2rem))] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:shadow-2xl"
      >
        <div className="flex justify-center pt-2 lg:hidden" aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-[#e5e5e5]" />
        </div>
        <div className="flex shrink-0 items-start justify-between gap-3 px-4 pt-3 pb-3">
          <div className="min-w-0">
            <JourneyStep step="수량" />
            <h2 id="buy-sheet-title" className="mt-2 text-base leading-snug font-normal break-words">
              <SelectedProductTitle />
            </h2>
          </div>
          <button type="button" className="h-10 w-10 shrink-0 text-xl leading-none" onClick={closeSheet} aria-label="닫기">
            ×
          </button>
        </div>
        <div className="min-h-0 min-w-0 space-y-4 overflow-x-hidden overflow-y-auto px-4 pb-4">
          <SheetOptions />
          <FlavorChoices />
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e5e5e5] px-3 py-3">
            <div className="min-w-0">
              <PriceTag price={price} compareAt={compareAt} size="unit" mark="unit" />
            </div>
            <QtyStepper />
          </div>
          {lines.length === 0 ? (
            <p className="sr-only" data-sheet-empty>
              담은 옵션이 없습니다.
            </p>
          ) : (
            <div data-sheet-lines>
              <p className="mb-2 text-sm text-[#111111]">담은 옵션</p>
              <ul className="space-y-2">
                {lines.map((line) => (
                  <li
                    key={line.slug}
                    data-sheet-line={line.slug}
                    data-config={line.label || undefined}
                    className="min-w-0 rounded-xl border border-[#e5e5e5] px-3 py-2.5"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 text-sm font-medium break-words" data-sheet-line-name>
                        {line.name}
                      </p>
                      <button
                        type="button"
                        className="shrink-0 text-[#666666]"
                        data-sheet-remove={line.slug}
                        onClick={() => removeLine(line.slug)}
                        aria-label={`${line.name} 빼기`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                          width="16"
                          height="16"
                          aria-hidden="true"
                          className="block size-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        >
                          <path d="M4 4 L12 12 M12 4 L4 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-2 flex min-w-0 flex-wrap items-center justify-between gap-2">
                      <LineQty name={line.name} qty={line.qty} onChange={(next) => changeLineQty(line.slug, next)} />
                      <p className="text-sm font-semibold tabular-nums" data-sheet-line-total={line.price * line.qty}>
                        {won(line.price * line.qty)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div
          className="shrink-0 overflow-x-hidden border-t border-[#e5e5e5] px-4 pt-3"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="mb-3 flex min-w-0 flex-wrap items-end justify-between gap-x-3 gap-y-1" data-sheet-total={total} data-sheet-count={totalQty}>
            <p className="text-sm">
              총 금액
              <span className="block text-xs text-muted-foreground">{totalQty}개</span>
            </p>
            <PriceTag price={total} compareAt={compareTotal} qty={1} size="sheet" mark="total" align="end" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              data-sheet-add
              className={cn(buttonVariants({ variant: "outline" }), "h-12 min-w-0 bg-white px-2 text-sm")}
              onClick={addSelection}
              disabled={!choice}
            >
              담기
            </button>
            {projectHref ? (
              <a
                href={projectHref}
                data-cart-buy="project"
                className={cn(buttonVariants(), brandNavyFill, "h-12 min-w-0 px-2 text-sm")}
                onClick={() => {
                  for (const line of lines) remember("buy_click", line.slug, line.qty)
                }}
              >
                구매하기
              </a>
            ) : (
              <button
                type="button"
                data-cart-buy="project"
                className={cn(buttonVariants(), brandNavyFill, "h-12 min-w-0 px-2 text-sm")}
                disabled
              >
                구매하기
              </button>
            )}
          </div>
          <ShippingNote place="sheet" className="mt-3" />
        </div>
      </div>
    </div>,
    document.body,
  )
}

const FLOW_CTA_ROOT_MARGIN = "-8px 0px 0px 0px"

export function MobileBuyBar({
  step,
  revealWhenCtaLeaves = false,
}: {
  step: Extract<JourneyName, "도착" | "상세">
  revealWhenCtaLeaves?: boolean
}) {
  const { qty, openSheet, selectedSlug } = useBuy()
  const [shown, setShown] = useState(!revealWhenCtaLeaves)

  useLayoutEffect(() => {
    if (!revealWhenCtaLeaves) return
    const target = document.querySelector<HTMLElement>("[data-buy-cta='flow']")
    if (!target) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShown(!entry.isIntersecting)
      },
      { root: null, rootMargin: FLOW_CTA_ROOT_MARGIN, threshold: 0 },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [revealWhenCtaLeaves])

  return (
    <>
      {shown ? (
        <style>{`@media (max-width: 1023px) { body { padding-bottom: calc(6.25rem + env(safe-area-inset-bottom)); } }`}</style>
      ) : null}
      <div
        data-mobile-buy-bar
        data-mobile-buy-bar-state={shown ? "shown" : "hidden"}
        data-buy-slug={selectedSlug}
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white",
          shown ? "lg:hidden" : "hidden",
        )}
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto max-w-6xl px-3 pt-3">
          {step === "상세" ? null : <JourneyStep step={step} />}
          {qty > 1 ? (
            <p className={cn("mb-2 text-xs text-muted-foreground", step === "상세" ? undefined : "mt-1")}>{qty}개</p>
          ) : null}
          <button type="button" className={cn(buttonVariants(), brandNavyFill, "h-12 w-full text-base")} onClick={openSheet}>
            구매하기
          </button>
        </div>
      </div>
    </>
  )
}
