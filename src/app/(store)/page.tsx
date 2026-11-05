import type { Metadata } from "next"
import Link from "next/link"
import { SCENE_SLIDE_TEST, SceneDeck } from "@/components/store/scene-deck"
import { Tracker } from "@/components/store/tracker"
import { buttonVariants } from "@/components/ui/button"
import { getProductBySlug, resolveOffer } from "@/lib/catalog"
import { getRequestContext } from "@/lib/request"
import { allowIndex, HOME_DESCRIPTION, HOME_TITLE, isPreviewQuery, publicMetadata } from "@/lib/seo"
import { cn } from "@/lib/utils"

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string | string[] }>
}): Promise<Metadata> {
  const query = await searchParams
  const context = await getRequestContext()
  return publicMetadata({
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    path: "/",
    index: allowIndex(isPreviewQuery(query.preview) || context.preview),
  })
}

export default async function HomePage() {
  const context = await getRequestContext()
  const product = getProductBySlug("sample-a")
  const offer = product && product.status === "active" ? resolveOffer(product, context.touch) : null

  return (
    <div className="bg-white">
      <Tracker />
      {product && offer ? (
        <SceneDeck>
          <section
            data-home-main
            className={cn(
              "relative flex flex-col",
              SCENE_SLIDE_TEST
                ? "h-full min-h-0"
                : "justify-center max-lg:h-[calc(100svh-3.5rem)] lg:min-h-[calc(100svh-4rem)]",
            )}
          >
            <div className="pointer-events-none relative z-10 flex h-full min-h-0 w-full flex-col pt-16 pb-4">
              <div className="mx-auto w-full max-w-6xl shrink-0 px-4 lg:px-8">
                <img src="/brand/ritmore.svg" alt="ritmore" className="h-7 w-auto lg:h-9" />
                <h1 className="mt-1 text-2xl leading-tight text-[#111111] lg:text-4xl">카페인 민트 캔디</h1>
              </div>
              <div className="relative min-h-0 w-full flex-1">
                <Link
                  href="/products"
                  data-product-link
                  aria-label={`${product.name} 상품`}
                  className="pointer-events-auto absolute inset-0 block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#111111]"
                >
                  <img
                    src="/brand/home-tin.png"
                    alt={`${product.name}. 페퍼민트 12개입 슬라이드 틴`}
                    className="h-full w-full object-contain"
                  />
                </Link>
              </div>
              <div className="mx-auto mt-2 grid w-full max-w-6xl shrink-0 grid-cols-2 gap-2 px-4 lg:px-8">
                <Link
                  href="/products"
                  data-home-buy
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "pointer-events-auto h-12 border-[#17364A] bg-[#17364A] px-3 text-base text-white hover:bg-[#17364A]/90",
                  )}
                >
                  구매하러가기
                </Link>
                <Link
                  href="/brand"
                  data-home-brand
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "pointer-events-auto h-12 border-[#17364A] bg-white px-3 text-base text-[#17364A] hover:bg-[#17364A]/5",
                  )}
                >
                  브랜드 보러가기
                </Link>
              </div>
            </div>
          </section>
        </SceneDeck>
      ) : null}
    </div>
  )
}
