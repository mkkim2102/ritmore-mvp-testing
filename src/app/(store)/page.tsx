import type { Metadata } from "next"
import Link from "next/link"
import { SCENE_SLIDE_TEST, SceneDeck } from "@/components/store/scene-deck"
import { TinModel } from "@/components/store/tin-model"
import { Tracker } from "@/components/store/tracker"
import { buttonVariants } from "@/components/ui/button"
import { getProductBySlug, resolveOffer } from "@/lib/catalog"
import { getRequestContext } from "@/lib/request"
import { allowIndex, HOME_DESCRIPTION, HOME_TITLE, isPreviewQuery, publicMetadata } from "@/lib/seo"
import { MAIN_COPY } from "@/lib/shop-guide"
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
                  <TinModel
                    orbit="18deg 58deg 0.198m"
                    fieldOfView="22deg"
                    target="-0.003m 0m 0m"
                    label={`${product.name}. 페퍼민트 12개입 슬라이드 틴`}
                  />
                </Link>
              </div>
              <div className="mx-auto mt-2 w-full max-w-6xl shrink-0 px-4 lg:hidden">
                <Link
                  href="/products"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "pointer-events-auto h-12 w-full border-[#17364A] bg-[#17364A] px-6 text-base text-white hover:bg-[#17364A]/90",
                  )}
                >
                  구매하러가기
                </Link>
              </div>
            </div>
          </section>
          <section data-home-copy className="flex h-full items-center px-4 pt-16 pb-8">
            <div className="mx-auto w-full max-w-3xl">
              <p className="text-xs font-medium text-[#111111]">{product.category}</p>
              <h2 className="mt-3 text-2xl leading-snug text-[#111111] lg:text-4xl">{product.summary}</h2>
              <p className="mt-6 text-base leading-8 text-[#111111] lg:text-lg">{product.description}</p>
            </div>
          </section>
          <section data-home-line className="flex h-full items-center px-4 pt-16 pb-8">
            <div className="mx-auto w-full max-w-3xl">
              <p className="text-2xl leading-snug text-[#111111] lg:text-4xl">{MAIN_COPY}</p>
              <p className="mt-6 leading-8 text-[#111111]">틴을 밀어 열고, 필요할 때 한 알씩 꺼냅니다.</p>
            </div>
          </section>
        </SceneDeck>
      ) : null}
    </div>
  )
}
