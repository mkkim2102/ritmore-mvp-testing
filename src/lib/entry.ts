import { randomUUID } from "node:crypto"
import {
  CUSTOMER_TIN_COUNTS,
  customerTinLabel,
  productPath,
  publicLandingPath,
  tinSlugForCount,
} from "@/lib/bundles"
import { linkCodeFromPath } from "@/lib/touch"

export const PUBLIC_ENTRY_ORIGIN = "https://ritmoremint.com"

export type EntryTarget = {
  path: string
  label: string
}

/** Pages a shopper can actually open: home, each pack detail, and purchase. */
export function entryTargets(): EntryTarget[] {
  return [
    { path: "/", label: "홈" },
    ...CUSTOMER_TIN_COUNTS.map((count) => ({
      path: productPath(tinSlugForCount(count)),
      label: `${customerTinLabel(count)} 상세`,
    })),
    { path: "/purchase", label: "구매" },
  ]
}

export function defaultEntryPath() {
  return productPath(tinSlugForCount(1))
}

export function entryCodeFromName(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/[-_]{2,}/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, 40)
  if (/^[a-z0-9][a-z0-9_-]{0,39}$/.test(slug)) return slug
  return `e${randomUUID().replace(/-/g, "").slice(0, 8)}`
}

/** Keep a path the operator typed. Rewrite retired sample and checkout paths to the live ones. */
export function normalizeEntrySuffix(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`
  if (withSlash.startsWith("//") || withSlash.includes("://") || withSlash.includes("\\")) return null
  let url: URL
  try {
    url = new URL(withSlash, PUBLIC_ENTRY_ORIGIN)
  } catch {
    return null
  }
  if (url.origin !== PUBLIC_ENTRY_ORIGIN || url.username || url.password) return null
  let pathname = url.pathname
  if (pathname.length > 1 && pathname.endsWith("/")) pathname = pathname.slice(0, -1)
  const normalized = publicLandingPath(`${pathname}${url.search}${url.hash}`)
  if (!normalized.startsWith("/") || normalized.startsWith("//") || normalized.includes("://")) return null
  if (normalized.length > 200) return null
  return normalized
}

/** Public codes are opaque. A name like fes or instagram is not written into the URL. */
export function opaqueEntryCode() {
  return `k${randomUUID().replace(/-/g, "").slice(0, 7)}`
}

export function entryCodeFor(_name: string, suffix: string) {
  const pathCode = linkCodeFromPath(new URL(suffix, PUBLIC_ENTRY_ORIGIN).pathname)
  return pathCode ?? opaqueEntryCode()
}

/**
 * Public URL is the site plus the operator path and, when the path is not already `/r/{code}`, the entry code.
 * Stored utm_source is never written into this URL.
 */
export function entryPublicUrl(landingPath: string, code: string) {
  const suffix = normalizeEntrySuffix(landingPath) ?? "/"
  const url = new URL(suffix, PUBLIC_ENTRY_ORIGIN)
  const pathCode = linkCodeFromPath(url.pathname)
  if (pathCode && pathCode === code.trim().toLowerCase()) {
    url.searchParams.delete("link")
    return url.toString()
  }
  if (!url.searchParams.has("link")) url.searchParams.set("link", code)
  return url.toString()
}

/** Where `/r/{code}` sends the browser. The link code stays on the query; channel params stay off it. */
export function entryRedirectTarget(landingPath: string, code: string) {
  const suffix = normalizeEntrySuffix(landingPath) ?? "/"
  const url = new URL(suffix, PUBLIC_ENTRY_ORIGIN)
  const pathCode = linkCodeFromPath(url.pathname)
  if (pathCode && pathCode === code.trim().toLowerCase()) {
    return `/?link=${encodeURIComponent(code)}`
  }
  if (!url.searchParams.has("link")) url.searchParams.set("link", code)
  return `${url.pathname}${url.search}${url.hash}`
}
