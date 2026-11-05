import { externalReferrer } from "@/lib/referrer"

export const COOKIE = {
  vid: "lv_vid",
  sid: "lv_sid",
  seen: "lv_seen",
  attr: "lv_attr",
  preview: "lv_preview",
  lab: "lv_lab",
} as const

export const HEADER = {
  vid: "x-storelab-vid",
  sid: "x-storelab-sid",
  attr: "x-storelab-attr",
  preview: "x-storelab-preview",
  path: "x-storelab-path",
  returned: "x-storelab-returned",
} as const

export const SESSION_IDLE_MS = 30 * 60 * 1000

export type Touch = {
  linkCode: string | null
  source: string | null
  medium: string | null
  campaign: string | null
  content: string | null
  term: string | null
  referrer: string | null
  landingPath: string
}

export function emptyTouch(landingPath = "/"): Touch {
  return {
    linkCode: null,
    source: null,
    medium: null,
    campaign: null,
    content: null,
    term: null,
    referrer: null,
    landingPath,
  }
}

export function encodeTouch(touch: Touch) {
  return Buffer.from(JSON.stringify(touch), "utf8").toString("base64url")
}

export function decodeTouch(value: string | null | undefined): Touch | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<Touch>
    if (!parsed || typeof parsed !== "object") return null
    return {
      linkCode: clip(parsed.linkCode),
      source: clip(parsed.source),
      medium: clip(parsed.medium),
      campaign: clip(parsed.campaign),
      content: clip(parsed.content),
      term: clip(parsed.term),
      referrer: clip(parsed.referrer, 300),
      landingPath: safePath(parsed.landingPath),
    }
  } catch {
    return null
  }
}

export function clip(value: unknown, max = 80) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, max)
}

export function cleanLinkCode(value: string | null | undefined) {
  if (!value) return null
  const code = value.trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9_-]{0,39}$/.test(code)) return null
  return code
}

export function safePath(value: unknown) {
  if (typeof value !== "string") return "/"
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) return "/"
  return value.slice(0, 200)
}

type Query = {
  link?: string | null
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  utm_content?: string | null
  utm_term?: string | null
  preview?: string | null
}

export function resolveVisit(input: {
  now: number
  pathname: string
  host: string | readonly string[]
  query: Query
  referer: string | null
  cookies: {
    vid?: string
    sid?: string
    seen?: string
    attr?: string
    preview?: string
  }
}) {
  const link = cleanLinkCode(input.query.link)
  const utm = {
    source: clip(input.query.utm_source),
    medium: clip(input.query.utm_medium),
    campaign: clip(input.query.utm_campaign),
    content: clip(input.query.utm_content),
    term: clip(input.query.utm_term),
  }
  const externalReferrer = externalReferrerOf(input.referer, input.host)
  const seenAt = Number(input.cookies.seen || "0")
  const previous = decodeTouch(input.cookies.attr)
  const idle = !seenAt || input.now - seenAt > SESSION_IDLE_MS
  const explicitNewLink = Boolean(link && previous?.linkCode && link !== previous.linkCode)
  const fresh = !input.cookies.sid || idle || explicitNewLink
  const returned = Boolean(input.cookies.vid) && seenAt > 0 && input.now - seenAt > SESSION_IDLE_MS

  let sid = input.cookies.sid || crypto.randomUUID()
  let touch = previous
  if (fresh) {
    sid = crypto.randomUUID()
    touch = buildTouch(link, utm, externalReferrer, input.pathname)
  } else if (touch && !touch.linkCode && !touch.source && (link || utm.source)) {
    touch = buildTouch(link, utm, touch.referrer || externalReferrer, touch.landingPath || input.pathname)
  }
  if (!touch) touch = buildTouch(link, utm, externalReferrer, input.pathname)

  let preview = input.cookies.preview === "1"
  if (fresh) preview = input.query.preview === "1"
  else if (input.query.preview === "1") preview = true

  const existingVisitor = input.cookies.vid
  return {
    vid: existingVisitor || crypto.randomUUID(),
    sid,
    touch,
    preview,
    returned,
    seen: String(input.now),
  }
}

function buildTouch(
  link: string | null,
  utm: {
    source: string | null
    medium: string | null
    campaign: string | null
    content: string | null
    term: string | null
  },
  referrer: string | null,
  landingPath: string,
): Touch {
  return {
    linkCode: link,
    source: utm.source,
    medium: utm.medium,
    campaign: utm.campaign,
    content: utm.content,
    term: utm.term,
    referrer,
    landingPath: safePath(landingPath),
  }
}

function externalReferrerOf(referer: string | null, host: string | readonly string[]) {
  return externalReferrer(referer, host)
}
