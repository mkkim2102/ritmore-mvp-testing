import {
  CUSTOMER_TIN_COUNTS,
  CUSTOMER_TIN_PRICES,
  TIN_BUNDLE_SPECS,
  customerTinLabel,
  internalProductSlug,
  tinCountForSlug,
  tinSlugForCount,
  type TinChoice,
} from "@/lib/bundles"
import type { Product } from "@/lib/types"

const singleTin = {
  name: "ritmore 카페인 민트 캔디",
  summary: "슬라이드 틴에 담긴 페퍼민트. 12개입.",
  description:
    "공부 책상, 야간 공부, 실습할 때 쓰는 카페인 민트 캔디입니다. 맛은 페퍼민트이고, 슬라이드 틴 하나에 12개가 들어 있습니다. 틴 크기는 55 × 67 × 9 mm입니다.",
  category: "페퍼민트",
}

const products: Product[] = CUSTOMER_TIN_COUNTS.map((count) => {
  const slug = tinSlugForCount(count)
  const copy = TIN_BUNDLE_SPECS.find((bundle) => bundle.count === count) ?? singleTin
  const { sale, list } = CUSTOMER_TIN_PRICES[count]

  return {
    slug,
    name: copy.name,
    summary: copy.summary,
    description: copy.description,
    category: copy.category,
    basePrice: sale,
    compareAtPrice: list,
    imageTone: "ritmore",
  }
})

export function listProducts() {
  return products
}

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === internalProductSlug(slug))
}

export function tinPurchaseOptions(): TinChoice[] {
  return products.map((product) => ({
    slug: product.slug,
    name: product.name,
    price: product.basePrice,
    compareAt: product.compareAtPrice,
    label: customerTinLabel(tinCountForSlug(product.slug) ?? 1),
  }))
}
