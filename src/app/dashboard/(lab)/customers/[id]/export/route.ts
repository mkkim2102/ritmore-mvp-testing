import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { labTokenValid } from "@/lib/auth"
import { buildVisitorCustomerWorkbook, visitorCjmFilename } from "@/lib/cjm-export"
import { xlsxHeaders } from "@/lib/cjm-workbook"
import { COOKIE } from "@/lib/touch"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const VISITOR_ID = /^[A-Za-z0-9_-]{8,80}$/

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const jar = await cookies()
  if (!labTokenValid(jar.get(COOKIE.lab)?.value)) redirect("/dashboard/login")

  const { id } = await context.params
  if (!VISITOR_ID.test(id)) return missingVisitor()

  const body = await buildVisitorCustomerWorkbook(id)
  if (!body) return missingVisitor()

  const names = visitorCjmFilename(id)
  return new Response(body, { headers: xlsxHeaders(names.filename, names.ascii) })
}

function missingVisitor() {
  return new Response("이 방문자를 찾지 못했습니다.", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  })
}
