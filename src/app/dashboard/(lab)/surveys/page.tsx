import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { customerFacingTinName } from "@/lib/bundles"
import { getProductBySlug } from "@/lib/catalog"
import { shortVisitorCode, won } from "@/lib/format"
import { referrerLabel } from "@/lib/referrer"
import { listSurveys } from "@/lib/survey"

export const metadata = { title: "설문" }

function surveyAmount(row: { product_slug: string | null; price: number | null; qty: number | null }) {
  if (row.price == null || row.qty == null) return ""
  const stacked = (row.product_slug ?? "").includes(",")
  return won(stacked ? row.price : row.price * row.qty)
}

function surveyProduct(raw: string | null) {
  if (!raw) return "—"
  return raw
    .split(",")
    .map((part) => part.split(":")[0])
    .filter(Boolean)
    .map((slug) => {
      const product = getProductBySlug(slug)
      return product ? customerFacingTinName(product.name, product.slug) : slug
    })
    .join(", ")
}

function seoulStamp(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso.slice(0, 16).replace("T", " ")
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date)
}

export default function SurveysPage() {
  const rows = listSurveys()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl">설문</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          구매하기를 두 번 누른 뒤 받은 답입니다. 이름과 연락처는 없습니다.
        </p>
      </div>
      {rows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>아직 답이 없습니다</CardTitle>
            <CardDescription>두 번째 구매하기 다음 페이지에서 답을 보내면 여기에 쌓입니다.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>시각</TableHead>
                <TableHead>방문자</TableHead>
                <TableHead>상품</TableHead>
                <TableHead>링크</TableHead>
                <TableHead>리퍼러</TableHead>
                <TableHead>세션</TableHead>
                <TableHead>구매 이유</TableHead>
                <TableHead>마음에 든 점</TableHead>
                <TableHead>확인하고 싶은 점</TableHead>
                <TableHead>언제</TableHead>
                <TableHead className="text-right">수량</TableHead>
                <TableHead className="text-right">금액</TableHead>
                <TableHead>말</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap text-xs">{seoulStamp(row.created_at)}</TableCell>
                  <TableCell className="font-mono text-xs">{shortVisitorCode(row.visitor_id)}</TableCell>
                  <TableCell className="text-xs">{surveyProduct(row.product_slug)}</TableCell>
                  <TableCell className="font-mono text-xs">{row.link_code || "—"}</TableCell>
                  <TableCell className="text-xs">{referrerLabel(row.referrer_class)}</TableCell>
                  <TableCell className="font-mono text-xs">{row.session_id.slice(0, 8)}</TableCell>
                  <TableCell className="max-w-xs whitespace-normal">{row.ease}</TableCell>
                  <TableCell className="max-w-xs whitespace-normal">{row.second_press}</TableCell>
                  <TableCell className="max-w-xs whitespace-normal">
                    {row.intent ? <span className="block">{row.intent}</span> : null}
                    {row.check_note ? (
                      <span className="block">{row.intent ? `기타: ${row.check_note}` : row.check_note}</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="max-w-xs whitespace-normal">{row.when_note}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.qty ?? ""}</TableCell>
                  <TableCell className="text-right tabular-nums">{surveyAmount(row)}</TableCell>
                  <TableCell className="max-w-xs text-sm whitespace-normal">
                    {row.note ? <span className="block">{row.note}</span> : null}
                    {row.like_note ? (
                      <span className="block">{row.note ? `마음에 든 점: ${row.like_note}` : row.like_note}</span>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
