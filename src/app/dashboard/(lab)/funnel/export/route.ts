import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { labTokenValid } from "@/lib/auth"
import { buildFunnelWorkbook, parseExportQuery } from "@/lib/funnel-workbook"
import { linkNames, listVisitorRollups, listWindowEvents } from "@/lib/journey"
import { COOKIE } from "@/lib/touch"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: Request) {
  const jar = await cookies()
  if (!labTokenValid(jar.get(COOKIE.lab)?.value)) redirect("/dashboard/login")

  const parsed = parseExportQuery(new URL(request.url).searchParams)
  if (!parsed.ok) {
    return new Response(parsed.error, {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    })
  }

  const window = { fromIso: parsed.fromIso, untilIso: parsed.untilIso }
  const body = await buildFunnelWorkbook({
    period: parsed.label,
    rollups: listVisitorRollups(window),
    events: listWindowEvents(window),
    names: linkNames(),
  })

  return new Response(body, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${parsed.filename}"`,
      "Cache-Control": "no-store",
    },
  })
}
