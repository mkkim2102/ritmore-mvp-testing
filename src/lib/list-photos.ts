/** 상품 목록 카드 사진. src가 비어 있으면 칸만 보이고, 경로를 넣으면 그 이미지를 보여 준다. */
export type ListPhoto = {
  slug: string
  src: string
  alt: string
}

export const PRODUCT_LIST_PHOTOS: ListPhoto[] = [
  { slug: "sample-a", src: "/products/sample-a.png", alt: "ritmore 카페인 민트 캔디 1개" },
  { slug: "sample-a-3", src: "/products/sample-a-3.png", alt: "ritmore 카페인 민트 캔디 3개" },
  { slug: "sample-a-6", src: "/products/sample-a-6.png", alt: "ritmore 카페인 민트 캔디 6개" },
]

export function listPhotoFor(slug: string): ListPhoto {
  return PRODUCT_LIST_PHOTOS.find((item) => item.slug === slug) ?? { slug, src: "", alt: "" }
}
