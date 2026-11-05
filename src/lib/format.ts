export function won(amount: number) {
  return `${new Intl.NumberFormat("ko-KR").format(Math.round(amount))}원`
}

export function shortVisitorCode(id: string) {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase()
}

export function seoulToday(now = new Date()) {
  return seoulYmd(now)
}

export function seoulDateTime(iso: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso))
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ""
  const hour = pick("hour") === "24" ? "00" : pick("hour")
  return `${pick("year")}-${pick("month")}-${pick("day")} ${hour}:${pick("minute")}:${pick("second")}`
}

export function seoulDayBounds(ymd: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const start = new Date(Date.UTC(year, month - 1, day, -9, 0, 0, 0))
  if (Number.isNaN(start.getTime())) return null
  if (seoulYmd(start) !== ymd) return null
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  return { start: start.toISOString(), end: end.toISOString() }
}

function seoulYmd(now: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
}

export function discountRate(listPrice: number | null | undefined, sellingPrice: number) {
  if (listPrice == null || !Number.isFinite(listPrice) || listPrice <= 0) return null
  if (!Number.isFinite(sellingPrice) || listPrice <= sellingPrice) return null
  return Math.round(((listPrice - sellingPrice) / listPrice) * 100)
}

export function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

export function rate(part: number, whole: number) {
  if (whole <= 0) return "—"
  return `${Math.round((part / whole) * 1000) / 10}%`
}

export function rangeStart(range: string, now = new Date()) {
  if (range === "all") return null
  const daysBack = range === "today" ? 0 : range === "30d" ? 29 : 6
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
  const [year, month, day] = ymd.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day - daysBack, -9, 0, 0, 0)).toISOString()
}

export function requestOrigin(headerList: Headers) {
  const host = headerList.get("x-forwarded-host") || headerList.get("host") || "127.0.0.1:43117"
  const proto = headerList.get("x-forwarded-proto") || "http"
  return `${proto}://${host}`
}

export function sourceLinkUrl(headerList: Headers, code: string) {
  const host = headerList.get("x-forwarded-host") || headerList.get("host")
  if (!host) return `/?link=${code}`
  const proto = headerList.get("x-forwarded-proto") || "http"
  return `${proto}://${host}/?link=${code}`
}

export function purchaseEntryUrl(origin: string, code: string) {
  const url = new URL("/products/sample-a", origin)
  url.searchParams.set("link", code)
  return url.toString()
}

export function formatDuration(seconds: number) {
  const total = Math.max(0, Math.round(seconds))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const remain = total % 60
  if (hours > 0) return `${hours}시간 ${minutes}분`
  if (minutes > 0 && remain > 0) return `${minutes}분 ${remain}초`
  if (minutes > 0) return `${minutes}분`
  return `${remain}초`
}

export function formatAverage(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "없음"
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}
