import { answerInquiryAction } from "@/lib/community-actions"
import { customerFacingTinName } from "@/lib/bundles"
import { listProducts } from "@/lib/catalog"
import type { Product } from "@/lib/types"
import { TIN_COMMUNITY_KEY, communityDate, listAllInquiries } from "@/lib/community"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export const metadata = { title: "문의" }

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>
}) {
  const query = await searchParams
  const rows = listAllInquiries()
  const products = listProducts(true)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl">문의</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          상품 페이지에 남긴 문의입니다. 비공개 문의는 가게에서만 봅니다. 문의마다 답변은 하나입니다.
        </p>
      </div>
      {query.error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{query.error}</p> : null}
      {query.saved ? <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm">답변을 저장했습니다.</p> : null}
      {rows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>아직 문의가 없습니다</CardTitle>
            <CardDescription>상품 페이지에서 문의를 남기면 여기에 보입니다.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <article key={row.id} data-dashboard-inquiry={row.id} className="space-y-4 rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{row.name || "익명"}</p>
                  <p className="text-xs text-muted-foreground">{inquiryProduct(row.productKey, products)}</p>
                  {row.isPrivate ? (
                    <span
                      className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium"
                      data-inquiry-private
                    >
                      비공개
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">{communityDate(row.createdAt)}</p>
              </div>
              <p className="leading-7 break-words whitespace-pre-wrap">{row.body}</p>
              <p className="text-sm text-muted-foreground">{row.answer ? "저장된 답변" : "답변 전"}</p>
              <form action={answerInquiryAction} className="space-y-3" data-answer-form={row.id}>
                <input type="hidden" name="id" value={row.id} />
                <div className="space-y-2">
                  <Label htmlFor={`answer-${row.id}`}>답변</Label>
                  <Textarea
                    id={`answer-${row.id}`}
                    name="answer"
                    required
                    maxLength={1000}
                    rows={4}
                    defaultValue={row.answer ?? ""}
                    className="min-h-28 text-base md:text-sm"
                  />
                </div>
                <Button type="submit" className="h-11 w-full sm:w-fit">
                  답변 저장
                </Button>
              </form>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function inquiryProduct(productKey: string, products: Product[]) {
  if (productKey === TIN_COMMUNITY_KEY) return "리트모어"
  const product = products.find((item) => item.slug === productKey || item.id === productKey)
  return product ? customerFacingTinName(product.name, product.slug) : productKey || "—"
}
