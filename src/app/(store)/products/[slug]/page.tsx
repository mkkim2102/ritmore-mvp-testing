import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ProductDetail } from "@/components/store/product-detail"
import { productShots } from "@/components/store/product-face"
import { productPath, publicProductSlug } from "@/lib/bundles"
import { coverPhotoFor } from "@/lib/product-slides"
import { getProductBySlug, listProducts, tinPurchaseOptions } from "@/lib/catalog"
import {
  allowIndex,
  jsonLdScript,
  productImageAlt,
  productMetaDescription,
  productStructuredData,
  productTitle,
  PRODUCTS_DESCRIPTION,
  publicMetadata,
} from "@/lib/seo"

export const dynamicParams = false

export function generateStaticParams() {
  return listProducts().map((product) => ({ slug: publicProductSlug(product.slug) }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = getProductBySlug(slug)
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
    index: allowIndex(),
  })
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = getProductBySlug(slug)
  if (!product) notFound()
  const configurations = tinPurchaseOptions()
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
        configurations={configurations}
        packOnPage={configurations.length > 0}
        optionsInSheet={configurations.length > 0}
      />
    </>
  )
}
