import { cookies, headers } from "next/headers"
import { COOKIE, decodeTouch, emptyTouch, HEADER } from "@/lib/touch"
import type { Touch } from "@/lib/touch"

export async function getRequestContext() {
  const headerList = await headers()
  const jar = await cookies()
  const touch =
    decodeTouch(headerList.get(HEADER.attr)) ||
    decodeTouch(jar.get(COOKIE.attr)?.value) ||
    emptyTouch()
  const previewHeader = headerList.get(HEADER.preview)
  const preview =
    previewHeader != null ? previewHeader === "1" : jar.get(COOKIE.preview)?.value === "1"
  const dest = (headerList.get("sec-fetch-dest") || "").toLowerCase()
  const purpose = `${headerList.get("purpose") || ""} ${headerList.get("sec-purpose") || ""}`.toLowerCase()
  const prefetch =
    headerList.get("next-router-prefetch") === "1" ||
    headerList.get("x-middleware-prefetch") === "1" ||
    purpose.includes("prefetch")
  return {
    visitorId: headerList.get(HEADER.vid) || jar.get(COOKIE.vid)?.value || "",
    sessionId: headerList.get(HEADER.sid) || jar.get(COOKIE.sid)?.value || "",
    preview,
    returned: headerList.get(HEADER.returned) === "1",
    prefetch,
    document: dest === "" || dest === "document",
    path: headerList.get(HEADER.path) || "/",
    touch: touch satisfies Touch,
    headerList,
  }
}
