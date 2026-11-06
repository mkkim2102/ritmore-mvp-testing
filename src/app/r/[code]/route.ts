import { NextResponse } from "next/server"
import { getLinkByCode } from "@/lib/catalog"
import { entryRedirectTarget } from "@/lib/entry"
import { cleanLinkCode } from "@/lib/touch"

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code: raw } = await context.params
  const code = cleanLinkCode(decodeURIComponent(raw))
  const link = code ? getLinkByCode(code) : null
  if (!code || !link || link.archived) {
    return NextResponse.redirect(new URL("/", request.url))
  }
  const target = entryRedirectTarget(link.landingPath, link.code)
  return NextResponse.redirect(new URL(target, request.url))
}
