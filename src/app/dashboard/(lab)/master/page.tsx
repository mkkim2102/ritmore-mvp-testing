import Link from "next/link"
import { CopyLink } from "@/components/dashboard/copy-link"
import { EntryUrlField } from "@/components/dashboard/entry-url-field"
import { PriceFields } from "@/components/dashboard/price-fields"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createEntryAction, deleteEntryAction, updateShelfPriceAction } from "@/lib/actions"
import { TIN_FAMILY, customerTinLabel, isCustomerTinSlug, productPath } from "@/lib/bundles"
import { getProductBySlug, listLinks, listVariants } from "@/lib/catalog"
import { CHANNELS, channelLabel } from "@/lib/channels"
import { defaultEntryPath, entryPublicUrl, entryTargets, PUBLIC_ENTRY_ORIGIN } from "@/lib/entry"
import { discountRate, won } from "@/lib/format"
import type { TrackingLink, Variant } from "@/lib/types"

export const metadata = { title: "마스터" }

const ORDER = ["n7q4", "h2v8", "r6c1", "w3m9", "instagram", "naver", "google", "ai", "ig-story", "yt-desc", "direct-home"]

export default async function MasterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string; created?: string; deleted?: string }>
}) {
  const query = await searchParams
  const product = getProductBySlug("sample-a")
  const links = listLinks()
    .filter((link) => !link.archived)
    .sort((a, b) => rank(a.code) - rank(b.code) || a.code.localeCompare(b.code))
  const variants = listVariants()
  const created = links.find((link) => link.code === query.created)
  const createdUrl = created ? entryPublicUrl(created.landingPath, created.code) : ""
  const shelf = product?.basePrice ?? 0
  const configs = TIN_FAMILY.map((item) => ({ ...item, product: getProductBySlug(item.slug) }))
  const savedConfig = configs.find((item) => item.slug === query.saved)
  const savedLabel = savedConfig && isCustomerTinSlug(savedConfig.slug) ? customerTinLabel(savedConfig.count) : ""

  return (
    <div className="space-y-8">
      {query.error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{query.error}</p> : null}
      {query.saved ? (
        <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm">
          {savedLabel ? `${savedLabel} ` : ""}이름, 정가, 실판매가를 저장했습니다. 할인율은 두 금액으로 계산됩니다.
          다른 구성의 이름과 가격, 이미 기록된 가격, 고정 진입점은 그대로입니다.
        </p>
      ) : null}
      {query.deleted ? (
        <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm">
          진입점을 지웠습니다. 지나간 방문은 그대로 남아 있습니다.
        </p>
      ) : null}
      {created ? (
        <Card>
          <CardHeader>
            <CardTitle>만든 진입점</CardTitle>
            <CardDescription>
              {created.name} / 코드 {created.code}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm break-all" data-created-url={createdUrl}>
              {createdUrl}
            </p>
            <CopyLink url={createdUrl} />
          </CardContent>
        </Card>
      ) : null}

      <Card
        data-tin-configs
        data-shelf-price={shelf}
        data-list-price={product?.compareAtPrice ?? ""}
        data-discount-rate={product ? (discountRate(product.compareAtPrice, product.basePrice) ?? "") : ""}
      >
        <CardHeader>
          <CardTitle>구성별 가격</CardTitle>
          <CardDescription>
            1개, 3개, 6개의 이름, 정가, 실판매가를 각각 저장합니다. 할인율은 입력하지 않고 두 금액으로 계산합니다.
            이름은 상품 목록 카드와 상세 제목이 같이 씁니다. 카드와 상세는 이름 앞의 ritmore와 끝의 개수 표시를
            빼고 보여 줍니다. 한 구성을 저장해도 다른 구성의 이름과 가격은 바뀌지 않습니다. 저장하면 새로
            들어오는 사람에게 그 구성의 이름과 금액이 보입니다. 지난 기록의 가격은 바꾸지 않습니다. ig-story 와
            yt-desc 의 실판매가 고정도 바꾸지 않습니다. 유입은 1개 판매 페이지입니다. 그 페이지에서 1개, 3개,
            6개를 고르면 이름과 가격이 그 구성으로 바뀝니다. 3개와 6개 주소는 같은 화면에서 해당 구성이 선택된
            상태로 열립니다. 12틴은 상품과 장바구니에 남아 있고, 판매 페이지와 첫 화면의 선택에는 나오지 않습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="divide-y divide-border rounded-xl border border-border">
            {configs.map((item) => {
              const editable = item.product != null && isCustomerTinSlug(item.slug)
              const rate = item.product ? discountRate(item.product.compareAtPrice, item.product.basePrice) : null
              return (
                <li
                  key={item.slug}
                  data-config-slug={item.slug}
                  data-config-count={item.count}
                  data-product-name={item.product?.name ?? ""}
                  data-list-price={item.product?.compareAtPrice ?? ""}
                  data-selling-price={item.product?.basePrice ?? ""}
                  data-discount-rate={rate ?? ""}
                  data-live-entry={item.entry ? "1" : "0"}
                  className="space-y-3 px-4 py-4"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-medium">
                      {isCustomerTinSlug(item.slug) ? customerTinLabel(item.count) : (item.product?.name ?? item.slug)}
                    </p>
                    <Link href={productPath(item.slug)} className="text-sm underline underline-offset-4">
                      판매 페이지
                    </Link>
                  </div>
                  {editable && item.product ? (
                    <>
                      <form
                        action={updateShelfPriceAction}
                        className="grid max-w-xl gap-4 sm:grid-cols-2"
                        data-price-editor={item.slug}
                      >
                        <input type="hidden" name="slug" value={item.slug} />
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor={`name-${item.slug}`}>이름</Label>
                          <Input
                            id={`name-${item.slug}`}
                            name="name"
                            className="h-9"
                            defaultValue={item.product.name}
                            maxLength={40}
                            required
                          />
                        </div>
                        <PriceFields
                          key={`${item.slug}-${item.product.basePrice}-${item.product.compareAtPrice ?? "none"}`}
                          id={item.slug}
                          selling={item.product.basePrice}
                          list={item.product.compareAtPrice}
                          separator=" / "
                        />
                        <Button type="submit" className="h-10 sm:col-span-2 sm:w-fit">
                          가격 저장
                        </Button>
                      </form>
                      <p className="text-sm text-muted-foreground">{item.entry ? "현재 유입" : "유입 아님"}</p>
                    </>
                  ) : (
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                      <div>
                        <dt className="text-muted-foreground">개수</dt>
                        <dd className="tabular-nums">{item.count}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">정가</dt>
                        <dd className="tabular-nums">
                          {item.product?.compareAtPrice != null ? won(item.product.compareAtPrice) : "없음"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">실판매가</dt>
                        <dd className="tabular-nums">{item.product ? won(item.product.basePrice) : "없음"}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">유입</dt>
                        <dd>{item.entry ? "현재 유입" : "아님"}</dd>
                      </div>
                    </dl>
                  )}
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>진입점 만들기</CardTitle>
          <CardDescription>
            짧은 이름, 메모, 가격 고정을 저장하면 코드가 생깁니다. 영문으로 적으면 그 글자가 코드가 됩니다. blog
            라고 적으면 코드는 blog 입니다. 가격을 비우면 진열 가격입니다. 공개 주소는 {PUBLIC_ENTRY_ORIGIN}{" "}
            과 고른 경로입니다. 주소에는 채널 이름이 들어가지 않고, 방문 기록에만 고른 채널이 남습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createEntryAction} className="grid gap-4 md:grid-cols-2" data-entry-form>
            <div className="space-y-2">
              <Label htmlFor="entry-name">짧은 이름</Label>
              <Input id="entry-name" name="name" className="h-9" placeholder="봄 게시물" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-channel">기록할 채널</Label>
              <select
                id="entry-channel"
                name="channel"
                className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                defaultValue="instagram"
              >
                {CHANNELS.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-price">가격 고정 (원)</Label>
              <Input id="entry-price" name="priceOverride" className="h-9" inputMode="numeric" placeholder="비우면 진열 가격" />
            </div>
            <EntryUrlField origin={PUBLIC_ENTRY_ORIGIN} targets={entryTargets()} defaultPath={defaultEntryPath()} />
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="entry-note">메모</Label>
              <Textarea id="entry-note" name="note" placeholder="어디에 둘지, 비워도 됩니다" />
            </div>
            <Button type="submit" className="h-10 md:col-span-2 md:w-fit">
              진입점 저장
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div>
          <h2 className="font-serif text-2xl">진입점</h2>
          <p className="text-sm text-muted-foreground">
            인스타그램, 네이버, 구글, AI, ig-story, yt-desc 를 포함한 전체 목록입니다. 지워도 지나간 방문은
            남습니다.
          </p>
        </div>
        <div className="space-y-3">
          {links.map((link) => {
            const url = entryPublicUrl(link.landingPath, link.code)
            const price = priceOf(link, variants, shelf)
            return (
              <Card
                key={link.id}
                size="sm"
                data-entry={link.code}
                data-entry-price={price.amount}
                data-entry-mode={price.mode}
              >
                <CardHeader>
                  <CardTitle>{link.name}</CardTitle>
                  <CardDescription>
                    {channelLabel(link.channel)} / {price.text}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm break-all" data-entry-url={url}>
                    {url}
                  </p>
                  {link.note ? <p className="text-sm text-muted-foreground">{link.note}</p> : null}
                  <div className="flex flex-wrap gap-2">
                    <CopyLink url={url} />
                    <form action={deleteEntryAction}>
                      <input type="hidden" name="id" value={link.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        삭제
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function rank(code: string) {
  const index = ORDER.indexOf(code)
  return index === -1 ? ORDER.length : index
}

function priceOf(link: TrackingLink, variants: Variant[], shelf: number) {
  if (link.priceOverride != null) {
    return { mode: "override", amount: link.priceOverride, text: `${won(link.priceOverride)} 고정` }
  }
  const variant = link.variantId ? variants.find((item) => item.id === link.variantId) : null
  if (variant) return { mode: "locked", amount: variant.price, text: `${won(variant.price)} 고정` }
  return { mode: "shelf", amount: shelf, text: `진열 가격 ${won(shelf)}` }
}
