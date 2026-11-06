import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { labTokenValid } from "@/lib/auth"
import { legacyStorefrontPath } from "@/lib/bundles"
import { COOKIE, encodeTouch, HEADER, linkCodeFromPath, resolveVisit } from "@/lib/touch"

const COOKIE_BASE = {
  path: "/",
  sameSite: "lax" as const,
  httpOnly: true,
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const destination = legacyStorefrontPath(pathname)
  if (destination) {
    const url = request.nextUrl.clone()
    url.pathname = destination
    return NextResponse.redirect(url, 308)
  }

  if (pathname.startsWith("/dashboard")) {
    if (pathname !== "/dashboard/login" && !labTokenValid(request.cookies.get(COOKIE.lab)?.value)) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard/login"
      url.search = ""
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  const purpose = `${request.headers.get("purpose") || ""} ${request.headers.get("sec-purpose") || ""}`.toLowerCase()
  const prefetch =
    request.headers.get("next-router-prefetch") === "1" ||
    request.headers.get("x-middleware-prefetch") === "1" ||
    purpose.includes("prefetch")

  const visit = resolveVisit({
    now: Date.now(),
    pathname,
    host: [request.headers.get("x-forwarded-host") || "", request.headers.get("host") || "", request.nextUrl.host],
    query: {
      link: request.nextUrl.searchParams.get("link") || linkCodeFromPath(pathname),
      utm_source: request.nextUrl.searchParams.get("utm_source"),
      utm_medium: request.nextUrl.searchParams.get("utm_medium"),
      utm_campaign: request.nextUrl.searchParams.get("utm_campaign"),
      utm_content: request.nextUrl.searchParams.get("utm_content"),
      utm_term: request.nextUrl.searchParams.get("utm_term"),
      preview: request.nextUrl.searchParams.get("preview"),
    },
    referer: request.headers.get("referer"),
    cookies: {
      vid: request.cookies.get(COOKIE.vid)?.value,
      sid: request.cookies.get(COOKIE.sid)?.value,
      seen: request.cookies.get(COOKIE.seen)?.value,
      attr: request.cookies.get(COOKIE.attr)?.value,
      preview: request.cookies.get(COOKIE.preview)?.value,
    },
  })

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(HEADER.vid, visit.vid)
  requestHeaders.set(HEADER.sid, visit.sid)
  requestHeaders.set(HEADER.attr, encodeTouch(visit.touch))
  requestHeaders.set(HEADER.preview, visit.preview ? "1" : "0")
  requestHeaders.set(HEADER.returned, visit.returned ? "1" : "0")
  requestHeaders.set(HEADER.path, pathname)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })
  if (prefetch) return response
  const month = 60 * 60 * 24 * 30
  response.cookies.set(COOKIE.vid, visit.vid, { ...COOKIE_BASE, maxAge: month })
  response.cookies.set(COOKIE.sid, visit.sid, { ...COOKIE_BASE, maxAge: month })
  response.cookies.set(COOKIE.seen, visit.seen, { ...COOKIE_BASE, maxAge: month })
  response.cookies.set(COOKIE.attr, encodeTouch(visit.touch), { ...COOKIE_BASE, maxAge: month })
  if (visit.preview) {
    response.cookies.set(COOKIE.preview, "1", { ...COOKIE_BASE, maxAge: 60 * 30 })
  } else {
    response.cookies.delete(COOKIE.preview)
  }
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
}
