import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { ProductDetail } from "@/components/store/product-detail"
import { productShots } from "@/components/store/product-face"
import { isCustomerTinSlug, isLegacyProductSlug, isTinFamily, productPath, TIN_ENTRY_SLUG } from "@/lib/bundles"
import { coverPhotoFor } from "@/lib/product-slides"
import { getProductBySlug, resolveOffer, tinPurchaseOptions } from "@/lib/catalog"
import { getRequestContext } from "@/lib/request"
import {
  allowIndex,
  isPreviewQuery,
  jsonLdScript,
  productImageAlt,
  productMetaDescription,
  productStructuredData,
  productTitle,
  PRODUCTS_DESCRIPTION,
  publicMetadata,
} from "@/lib/seo"

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string | string[] }>
}): Promise<Metadata> {
  const { slug } = await params
  const query = await searchParams
  const product = getProductBySlug(slug)
  const context = await getRequestContext()
  const index = allowIndex(isPreviewQuery(query.preview) || context.preview) && product?.status === "active"
  if (!product) {
    return publicMetadata({
      title: "상품 | 리트모어",
      description: PRODUCTS_DESCRIPTION,
      path: productPath(slug),
      index: false,
    })
  }
  return publicMetadata({
    title: productTitle(product.name),
    description: productMetaDescription(product.name, product.summary),
    path: productPath(product.slug),
    imagePath: coverPhotoFor(product.slug) ?? productShots(product.imageTone).main,
    imageAlt: productImageAlt(product.name),
    index,
  })
}

function withQuery(path: string, query: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string") params.append(key, value)
    else if (Array.isArray(value)) for (const item of value) params.append(key, item)
  }
  const qs = params.toString()
  return qs ? `${path}?${qs}` : path
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { slug } = await params
  const query = await searchParams
  if (isLegacyProductSlug(slug)) redirect(withQuery(productPath(slug), query))
  const product = getProductBySlug(slug)
  if (!product || product.status !== "active") notFound()
  if (isTinFamily(slug) && !isCustomerTinSlug(slug)) {
    redirect(withQuery(productPath(TIN_ENTRY_SLUG), query))
  }
  const context = await getRequestContext()
  const offer = resolveOffer(product, context.touch)
  const family = isTinFamily(slug)
  const configurations = family ? tinPurchaseOptions(context.touch) : []
  const structured = productStructuredData({
    name: product.name,
    slug: product.slug,
    basePrice: product.basePrice,
    imagePath: coverPhotoFor(product.slug) ?? productShots(product.imageTone).main,
    summary: product.summary,
  })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(structured) }} />
      <ProductDetail
        product={product}
        offer={offer}
        configurations={configurations}
        packOnPage={configurations.length > 0}
        optionsInSheet={configurations.length > 0}
      />
    </>
  )
}
