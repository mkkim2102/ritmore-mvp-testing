import Link from "next/link"
import { BuyPanel, MobileBuyBar, ProductBuyProvider, SelectedProductTitle } from "@/components/store/buy-panel"
import { ProductGallery } from "@/components/store/product-gallery"
import { TinMark } from "@/components/store/product-face"
import { ReviewPages } from "@/components/store/review-pages"
import { isTinFamily, type TinChoice } from "@/lib/bundles"
import { detailSlidesFor } from "@/lib/product-slides"
import { TIN_DETAIL_PAGES } from "@/lib/detail-images"
import { landingFor } from "@/lib/landing"
import { guideSections } from "@/lib/shop-guide"
import type { Product } from "@/lib/types"

function StarRow({ score }: { score: string }) {
  const value = Math.max(0, Math.min(5, Math.round(Number(score) || 0)))
  return (
    <span className="inline-flex tracking-[0.12em]" aria-hidden>
      {Array.from({ length: 5 }, (_, star) => (
        <span key={star} className={star < value ? "text-[#111111]" : "text-[#d4d4d4]"}>
          ★
        </span>
      ))}
    </span>
  )
}

export function ProductDetail({
  product,
  configurations = [],
  packOnPage = false,
  optionsInSheet = false,
}: {
  product: Product
  configurations?: TinChoice[]
  packOnPage?: boolean
  optionsInSheet?: boolean
}) {
  const landing = landingFor(product)
  const sharedCopy = isTinFamily(product.slug)
  const sampleCards = landing.reviews.map((review, reviewIndex) => ({
    key: `${review.name}-${review.date}-${reviewIndex}`,
    source: "sample" as const,
    name: review.name,
    score: review.score,
    date: review.date,
    body: review.body,
  }))
  const reviewCount = sampleCards.length
  const previewReviews = sampleCards.slice(0, 3)

  return (
    <ProductBuyProvider
      slug={product.slug}
      name={product.name}
      price={product.basePrice}
      compareAt={product.compareAtPrice}
      flavors={landing.flavors}
      configurations={configurations}
      optionsInSheet={optionsInSheet}
      packOnPage={packOnPage}
      syncPackUrl={packOnPage}
      shippingNote={sharedCopy ? landing.shipping : null}
    >
      <div
        data-product-frame
        className="lg:mx-auto lg:grid lg:max-w-6xl lg:grid-cols-[minmax(0,10fr)_minmax(14rem,3.5fr)] lg:items-stretch lg:gap-x-8 lg:px-4 lg:py-8"
      >
        <div className="px-4 pt-4 lg:col-span-2 lg:px-0 lg:pt-0">
          <Link href="/products" className="text-sm text-[#111111] underline underline-offset-4">
            상품
          </Link>
        </div>
        <div className="min-w-0">
          <div className="mx-auto max-w-6xl px-4 py-4 lg:max-w-none lg:px-0 lg:py-0">
            <div className="space-y-3">
              <ProductGallery
                slides={detailSlidesFor(product.slug)}
                name={product.name}
                aspectClass="aspect-square"
                className="rounded-2xl lg:rounded-3xl"
              />
              <div className="lg:hidden">
                <p className="flex items-center gap-1.5 text-[11px] font-medium text-[#111111]">
                  <TinMark />
                  {landing.eyebrow}
                </p>
                <h1 className="mt-1 text-[1.45rem] leading-tight font-normal text-[#111111]">
                  <SelectedProductTitle />
                </h1>
              </div>
            </div>
            <div className="mt-5 lg:hidden">
              <BuyPanel flowCta />
            </div>
          </div>

          <div className="mx-auto mt-6 max-w-6xl space-y-6 px-4 lg:mt-8 lg:max-w-none lg:px-0">
            <div className="space-y-3 border-t border-border pt-4" data-review-preview>
              {previewReviews.length > 0 ? (
                <ul className="space-y-3">
                  {previewReviews.map((review) => (
                    <li key={review.key} className="text-sm">
                      <p className="flex items-center gap-2">
                        <span className="font-medium">{review.name}</span>
                        <StarRow score={review.score} />
                      </p>
                      <p className="mt-1 text-muted-foreground">{review.body}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">표시할 후기가 없습니다.</p>
              )}
            </div>
          </div>
          <div className="min-w-0">
            <nav className="sticky top-14 z-10 border-y border-border bg-background/95 backdrop-blur md:top-16">
              <div className="mx-auto grid max-w-6xl grid-cols-3 px-4 text-sm lg:max-w-none lg:px-0">
                {[
                  ["#detail", "상세"],
                  ["#reviews", "후기"],
                  ["#purchase", "구매안내"],
                ].map(([href, label]) => (
                  <a key={href} href={href} className="flex justify-center border-b-2 border-transparent py-3 whitespace-nowrap hover:border-foreground">
                    {label}
                  </a>
                ))}
              </div>
            </nav>

            <section
              id="detail"
              className={
                sharedCopy
                  ? "scroll-mt-32"
                  : "mx-auto max-w-6xl scroll-mt-32 space-y-10 px-4 py-14 lg:max-w-none lg:px-0"
              }
            >
              {sharedCopy ? (
                <div data-detail-images className="flex w-full flex-col gap-0">
                  {TIN_DETAIL_PAGES.map((image, index) => (
                    <img
                      key={image.src}
                      src={image.src}
                      alt={image.alt}
                      width={2580}
                      height={3300}
                      loading="lazy"
                      decoding="async"
                      data-detail-slot={index + 1}
                      className="block h-auto w-full max-w-full"
                    />
                  ))}
                </div>
              ) : null}
            </section>

            <section id="reviews" className="scroll-mt-40 border-t border-border bg-card" data-review-count={reviewCount}>
              <div className="mx-auto max-w-6xl px-4 py-14 lg:max-w-none lg:px-0">
                <div className="flex items-end justify-between gap-4">
                  <h2 className="font-serif text-3xl">후기</h2>
                  <p className="text-sm text-muted-foreground">후기 {reviewCount}개</p>
                </div>
                {reviewCount > 0 ? <ReviewPages key={product.slug} reviews={sampleCards} /> : (
                  <p className="mt-8 text-sm leading-6 text-muted-foreground" data-review-empty>
                    표시할 후기가 없습니다.
                  </p>
                )}
              </div>
            </section>

            <section id="purchase" className="scroll-mt-40 border-t border-border bg-white px-4 py-14 lg:min-w-0 lg:px-0">
                <p className="text-xs font-medium text-muted-foreground">구매안내</p>
                <h2 className="mt-2 font-serif text-3xl text-[#111111]">배송, 교환, 환불</h2>
                <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-1">
                  {guideSections
                    .filter((section) => section.id !== "order")
                    .map((section) => (
                      <article key={section.id} id={section.id} className="scroll-mt-40">
                        <h3 className="font-medium text-[#111111]">{section.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-muted-foreground">
                          {section.id === "ship" && sharedCopy ? landing.shipping : section.body}
                        </p>
                      </article>
                    ))}
                </div>
            </section>
        </div>
        </div>
        <aside className="hidden min-w-0 lg:block">
          <div data-buy-rail className="min-w-0 lg:sticky lg:top-20 lg:z-10">
            <div className="min-w-0 space-y-6 bg-white lg:max-h-[calc(100svh-6.5rem)] lg:overflow-x-hidden lg:overflow-y-auto lg:overscroll-contain lg:pb-4">
              <div className="min-w-0 space-y-3">
                <p className="flex min-w-0 items-center gap-1.5 text-xs break-words text-[#111111]">
                  <TinMark />
                  {landing.eyebrow}
                </p>
                <p className="min-w-0 font-serif text-3xl leading-tight font-normal break-words text-[#111111]">
                  <SelectedProductTitle />
                </p>
              </div>
              <BuyPanel shippingAnchor priceSize="rail" />
            </div>
          </div>
        </aside>
      </div>
      <MobileBuyBar step="상세" revealWhenCtaLeaves />
    </ProductBuyProvider>
  )
}
