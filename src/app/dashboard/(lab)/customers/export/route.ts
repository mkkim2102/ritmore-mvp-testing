import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { labTokenValid } from "@/lib/auth"
import { buildFilteredCustomerWorkbook, bulkCjmFilename } from "@/lib/cjm-export"
import { xlsxHeaders } from "@/lib/cjm-workbook"
import { COOKIE } from "@/lib/touch"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: Request) {
  const jar = await cookies()
  if (!labTokenValid(jar.get(COOKIE.lab)?.value)) redirect("/dashboard/login")

  const params = new URL(request.url).searchParams
  const names = bulkCjmFilename()
  const body = await buildFilteredCustomerWorkbook({
    action: (params.get("action") || "").trim(),
    option: (params.get("option") || "").trim(),
    route: (params.get("route") || "").trim(),
  })
  return new Response(body, { headers: xlsxHeaders(names.filename, names.ascii) })
}
