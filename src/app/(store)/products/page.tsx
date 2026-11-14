import type { Metadata } from "next"
import Link from "next/link"
import { PriceTag } from "@/components/store/price-tag"
import { packChoiceLabel, productPath, shelfProductName, tinCountForSlug } from "@/lib/bundles"
import { tinPurchaseOptions } from "@/lib/catalog"
import { listPhotoFor } from "@/lib/list-photos"
import { allowIndex, PRODUCTS_DESCRIPTION, PRODUCTS_TITLE, publicMetadata } from "@/lib/seo"

export const metadata: Metadata = publicMetadata({
  title: PRODUCTS_TITLE,
  description: PRODUCTS_DESCRIPTION,
  path: "/products",
  index: allowIndex(),
})

function ChoicePhoto({ src, alt, focus }: { src: string; alt: string; focus?: string }) {
  const path = src.trim()
  if (path) {
    return (
      <div data-choice-photo="image" className="aspect-square w-full shrink-0 overflow-hidden">
        <img src={path} alt={alt} className="h-full w-full object-cover" style={focus ? { objectPosition: focus } : undefined} />
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

export default function ProductsPage() {
  const choices = tinPurchaseOptions().map((item) => ({
    slug: item.slug,
    label: item.label,
    name: shelfProductName(item.name),
    price: item.price,
    compareAt: item.compareAt,
  }))

  return (
    <div className="bg-white text-[#111111]">
      <div className="mx-auto w-full max-w-[58rem] px-4 py-6 lg:py-9">
        <h1 className="text-xl leading-tight text-[#111111] lg:text-2xl">상품</h1>
        {choices.length === 0 ? (
          <p className="mt-8 text-[#111111]">보이는 상품이 없습니다.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 items-stretch gap-2 lg:grid-cols-3 lg:gap-2.5" data-choice-grid>
            {choices.map((item) => {
              const photo = listPhotoFor(item.slug)
              return (
                <Link
                  key={item.slug}
                  href={productPath(item.slug)}
                  data-choice={item.label}
                  data-choice-slug={item.slug}
                  className="flex h-full flex-col overflow-hidden border border-solid border-[#e5e5e5] bg-white text-[#111111] shadow-none"
                >
                  <ChoicePhoto
                    src={photo.src}
                    alt={`${item.name} ${item.label}`.trim()}
                    focus={item.slug === "sample-a" ? "center 8%" : undefined}
                  />
                  <div className="flex flex-1 flex-col px-2.5 pt-2 pb-2.5 sm:px-3">
                    <p className="text-sm font-medium text-[#111111]" data-tablet-count>
                      {packChoiceLabel(tinCountForSlug(item.slug) ?? 1)}
                    </p>
                    <p className="mt-1 text-[13px] leading-snug text-[#111111]" data-choice-name>
                      {item.name}
                    </p>
                    <div className="mt-auto pt-2">
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
