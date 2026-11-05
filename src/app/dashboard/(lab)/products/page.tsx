import { PriceFields } from "@/components/dashboard/price-fields"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  createExperimentAction,
  updateBrandAction,
  updateProductAction,
  updateVariantAction,
} from "@/lib/actions"
import { getBrand, listExperiments, listProducts, listVariants } from "@/lib/catalog"
import { discountRate, won } from "@/lib/format"

export const metadata = { title: "상품과 가격안" }

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

export default async function ProductsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>
}) {
  const query = await searchParams
  const brand = getBrand()
  const products = listProducts(true)
  const variants = listVariants()
  const experiments = listExperiments()

  return (
    <div className="space-y-8">
      {query.error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{query.error}</p> : null}
      {query.saved ? <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm">저장했습니다. 스토어에 바로 반영됩니다.</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>브랜드 자리</CardTitle>
          <CardDescription>이름과 한 줄 소개만 바꿉니다. 실브랜드가 정해지면 여기 넣으면 됩니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateBrandAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="brand-name">이름</Label>
              <Input id="brand-name" name="name" className="h-9" defaultValue={brand.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-tagline">한 줄 소개</Label>
              <Input id="brand-tagline" name="tagline" className="h-9" defaultValue={brand.tagline} />
            </div>
            <Button type="submit" className="h-10 md:w-fit">
              브랜드 자리 저장
            </Button>
          </form>
        </CardContent>
      </Card>

      {products.map((product) => {
        const productVariants = variants.filter((variant) => variant.productId === product.id)
        const rate = discountRate(product.compareAtPrice, product.basePrice)
        return (
          <Card key={product.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {product.name}
                {product.status === "hidden" ? <Badge variant="outline">숨김</Badge> : null}
              </CardTitle>
              <CardDescription>
                정가 {product.compareAtPrice != null ? won(product.compareAtPrice) : "없음"}
                {" · "}
                실판매가 {won(product.basePrice)}
                {rate != null ? (
                  <>
                    {" · "}
                    <span className="text-[#e10600]">{`${rate}%`}</span>
                  </>
                ) : null}
                {". "}
                링크가 실판매가를 고정하지 않으면 이 금액이 보입니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form action={updateProductAction} className="grid gap-4 md:grid-cols-2">
                <input type="hidden" name="id" value={product.id} />
                <div className="space-y-2">
                  <Label htmlFor={`name-${product.id}`}>이름</Label>
                  <Input id={`name-${product.id}`} name="name" className="h-9" defaultValue={product.name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`category-${product.id}`}>분류</Label>
                  <Input id={`category-${product.id}`} name="category" className="h-9" defaultValue={product.category} />
                </div>
                <PriceFields
                  key={`${product.id}-${product.basePrice}-${product.compareAtPrice ?? "none"}`}
                  id={product.id}
                  selling={product.basePrice}
                  list={product.compareAtPrice}
                />
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`summary-${product.id}`}>짧은 설명</Label>
                  <Input id={`summary-${product.id}`} name="summary" className="h-9" defaultValue={product.summary} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`description-${product.id}`}>본문</Label>
                  <Textarea id={`description-${product.id}`} name="description" defaultValue={product.description} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`status-${product.id}`}>노출</Label>
                  <select id={`status-${product.id}`} name="status" className={selectClass} defaultValue={product.status}>
                    <option value="active">보임</option>
                    <option value="hidden">숨김</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="h-10">
                    상품 저장
                  </Button>
                </div>
              </form>

              {productVariants.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">가격안</h3>
                  {productVariants.map((variant) => {
                    const experiment = experiments.find((item) => item.id === variant.experimentId)
                    return (
                      <form key={variant.id} action={updateVariantAction} className="grid items-end gap-3 rounded-xl border border-border p-3 md:grid-cols-[1fr_8rem_8rem_auto]">
                        <input type="hidden" name="id" value={variant.id} />
                        <p className="text-sm text-muted-foreground">
                          {experiment?.name} · {variant.key}
                        </p>
                        <Input name="label" aria-label="가격안 이름" className="h-9" defaultValue={variant.label} />
                        <Input name="price" aria-label="실판매가" type="number" min={0} className="h-9" defaultValue={variant.price} />
                        <Button type="submit" variant="outline" className="h-9">
                          가격안 저장
                        </Button>
                      </form>
                    )
                  })}
                </div>
              ) : null}
            </CardContent>
          </Card>
        )
      })}

      <Card>
        <CardHeader>
          <CardTitle>가격 테스트 추가</CardTitle>
          <CardDescription>한 상품에 가격 두 개를 만들고, 링크에서 어느 쪽을 보일지 고릅니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createExperimentAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="exp-name">실험 이름</Label>
              <Input id="exp-name" name="name" className="h-9" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp-product">상품</Label>
              <select id="exp-product" name="productId" className={selectClass} defaultValue={products[0]?.id}>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="label-a">A 이름</Label>
              <Input id="label-a" name="labelA" className="h-9" defaultValue="기본안" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price-a">A 가격 (원)</Label>
              <Input id="price-a" name="priceA" type="number" min={0} className="h-9" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="label-b">B 이름</Label>
              <Input id="label-b" name="labelB" className="h-9" defaultValue="비교안" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price-b">B 가격 (원)</Label>
              <Input id="price-b" name="priceB" type="number" min={0} className="h-9" required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="hypothesis">보고 싶은 것</Label>
              <Input id="hypothesis" name="hypothesis" className="h-9" placeholder="가격을 올리면 결제 클릭이 줄어드는지" />
            </div>
            <Button type="submit" className="h-10 md:w-fit">
              실험 만들기
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
