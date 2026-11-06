import { headers } from "next/headers"
import { CopyLink } from "@/components/dashboard/copy-link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { archiveLinkAction, createLinkAction } from "@/lib/actions"
import { productPath } from "@/lib/bundles"
import { CHANNELS, channelLabel } from "@/lib/channels"
import { getProductById, linkHref, listLinks, listProducts, listVariants } from "@/lib/catalog"
import { requestOrigin, won } from "@/lib/format"

export const metadata = { title: "유입 링크" }

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

export default async function LinksPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string; created?: string }>
}) {
  const query = await searchParams
  const links = listLinks()
  const variants = listVariants().filter((variant) => variant.active)
  const products = listProducts(true)
  const origin = requestOrigin(await headers())
  const created = links.find((link) => link.code === query.created)

  return (
    <div className="space-y-8">
      {query.error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{query.error}</p> : null}
      {query.saved ? <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm">링크를 보관했습니다. 예전 기록은 남습니다.</p> : null}
      {created ? (
        <Card>
          <CardHeader>
            <CardTitle>만든 주소</CardTitle>
            <CardDescription>{created.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm break-all">{linkHref(origin, created)}</p>
            <CopyLink url={linkHref(origin, created)} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>링크 만들기</CardTitle>
          <CardDescription>
            가격안을 고르면 그 주소로 들어온 사람에게 그 가격만 보입니다. 비우면 상품 기본가입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createLinkAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input id="name" name="name" className="h-9" placeholder="인스타 스토리 2차" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">코드</Label>
              <Input id="code" name="code" className="h-9" placeholder="비우면 자동으로 만듭니다" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="channel">채널</Label>
              <select id="channel" name="channel" className={selectClass} defaultValue="instagram">
                {CHANNELS.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="variantId">가격안</Label>
              <select id="variantId" name="variantId" className={selectClass} defaultValue="">
                <option value="">기본가</option>
                {variants.map((variant) => {
                  const product = getProductById(variant.productId)
                  return (
                    <option key={variant.id} value={variant.id}>
                      {product?.name} · {variant.label} · {won(variant.price)}
                    </option>
                  )
                })}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="landingPath">도착 경로</Label>
              <select id="landingPath" name="landingPath" className={selectClass} defaultValue="/">
                <option value="/">홈</option>
                <option value="/products">상품 목록</option>
                {products
                  .filter((product) => product.status === "active")
                  .map((product) => (
                    <option key={product.id} value={productPath(product.slug)}>
                      {product.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="utmCampaign">캠페인</Label>
              <Input id="utmCampaign" name="utmCampaign" className="h-9" placeholder="price-1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="utmSource">UTM 소스</Label>
              <Input id="utmSource" name="utmSource" className="h-9" placeholder="비우면 채널 기본값" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="utmMedium">UTM 매체</Label>
              <Input id="utmMedium" name="utmMedium" className="h-9" placeholder="story" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="utmContent">UTM 콘텐츠</Label>
              <Input id="utmContent" name="utmContent" className="h-9" placeholder="variant-a" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="note">메모</Label>
              <Textarea id="note" name="note" placeholder="이 링크를 어디에 두는지" />
            </div>
            <Button type="submit" className="h-10 md:col-span-2 md:w-fit">
              링크 저장
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {links.map((link) => {
          const url = linkHref(origin, link)
          const variant = variants.find((item) => item.id === link.variantId)
          return (
            <Card key={link.id} size="sm">
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  {link.name}
                  {link.archived ? <Badge variant="outline">보관</Badge> : null}
                </CardTitle>
                <CardDescription>
                  {channelLabel(link.channel)} · {link.code}
                  {variant ? ` · ${variant.label} ${won(variant.price)}` : " · 기본가"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm break-all">{url}</p>
                {link.note ? <p className="text-sm text-muted-foreground">{link.note}</p> : null}
                <div className="flex flex-wrap gap-2">
                  <CopyLink url={url} />
                  {link.archived ? null : (
                    <form action={archiveLinkAction}>
                      <input type="hidden" name="id" value={link.id} />
                      <Button type="submit" variant="outline" size="sm">
                        보관
                      </Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
