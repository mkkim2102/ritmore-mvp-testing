import type { Metadata } from "next"
import Link from "next/link"
import { PriceTag } from "@/components/store/price-tag"
import { Tracker } from "@/components/store/tracker"
import { packChoiceLabel, shelfProductName, tinCountForSlug } from "@/lib/bundles"
import { tinPurchaseOptions } from "@/lib/catalog"
import { listPhotoFor } from "@/lib/list-photos"
import { getRequestContext } from "@/lib/request"
import { allowIndex, isPreviewQuery, PRODUCTS_DESCRIPTION, PRODUCTS_TITLE, publicMetadata } from "@/lib/seo"

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string | string[] }>
}): Promise<Metadata> {
  const query = await searchParams
  const context = await getRequestContext()
  return publicMetadata({
    title: PRODUCTS_TITLE,
    description: PRODUCTS_DESCRIPTION,
    path: "/products",
    index: allowIndex(isPreviewQuery(query.preview) || context.preview),
  })
}

function ChoicePhoto({ src, alt }: { src: string; alt: string }) {
  const path = src.trim()
  if (path) {
    return (
      <div data-choice-photo="image" className="aspect-square w-full shrink-0 overflow-hidden">
        <img src={path} alt={alt} className="h-full w-full object-cover" />
      </div>
    )
  }
  return (
    <div
      data-choice-photo="empty"
      aria-hidden
      className="aspect-square w-full shrink-0 border-b border-solid border-[#e5e5e5] bg-white"
    />
  )
}

export default async function ProductsPage() {
  const context = await getRequestContext()
  const choices = tinPurchaseOptions(context.touch).map((item) => ({
    slug: item.slug,
    label: item.label,
    name: shelfProductName(item.name),
    price: item.price,
    compareAt: item.compareAt,
  }))

  return (
    <div className="bg-white text-[#111111]">
      <Tracker step="catalog_view" />
      <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:py-12">
        <h1 className="text-2xl leading-tight text-[#111111] lg:text-3xl">상품</h1>
        {choices.length === 0 ? (
          <p className="mt-8 text-[#111111]">보이는 상품이 없습니다.</p>
        ) : (
          <div className="mt-6 grid grid-cols-2 items-stretch gap-3" data-choice-grid>
            {choices.map((item) => {
              const photo = listPhotoFor(item.slug)
              return (
                <Link
                  key={item.slug}
                  href={`/products/${item.slug}`}
                  data-choice={item.label}
                  data-choice-slug={item.slug}
                  className="flex h-full flex-col overflow-hidden border border-solid border-[#e5e5e5] bg-white text-[#111111] shadow-none"
                >
                  <ChoicePhoto src={photo.src} alt={`${item.name} ${item.label}`.trim()} />
                  <div className="flex flex-1 flex-col px-3 pt-3 pb-3 sm:px-4">
                    <p className="text-base font-medium text-[#111111]" data-tablet-count>
                      {packChoiceLabel(tinCountForSlug(item.slug) ?? 1)}
                    </p>
                    <p className="mt-2 text-sm leading-snug text-[#111111]" data-choice-name>
                      {item.name}
                    </p>
                    <div className="mt-auto pt-3">
                      <PriceTag price={item.price} compareAt={item.compareAt} size="card" sellingLabel="할인가" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
