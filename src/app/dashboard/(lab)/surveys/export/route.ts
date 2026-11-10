import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { labTokenValid } from "@/lib/auth"
import { customerFacingTinName } from "@/lib/bundles"
import { getProductBySlug } from "@/lib/catalog"
import { xlsxHeaders } from "@/lib/cjm-workbook"
import { listSurveys } from "@/lib/survey"
import { buildSurveyWorkbook, surveyExportFilename } from "@/lib/survey-workbook"
import { COOKIE } from "@/lib/touch"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const jar = await cookies()
  if (!labTokenValid(jar.get(COOKIE.lab)?.value)) redirect("/dashboard/login")

  const names = surveyExportFilename()
  const body = await buildSurveyWorkbook(listSurveys(), (slug) => {
    const product = getProductBySlug(slug)
    return product ? customerFacingTinName(product.name, product.slug) : null
  })
  return new Response(body, { headers: xlsxHeaders(names.filename, names.ascii) })
}
