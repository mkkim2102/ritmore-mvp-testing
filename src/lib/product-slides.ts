/** 상세 첫 화면 사진. 한 장 더 넣을 때는 이 배열 끝에 항목을 추가한다. */
export type DetailSlide =
  | { id: string; kind: "model" }
  | { id: string; kind: "image"; src: string; alt: string; fit?: "contain" | "cover" }

export const PRODUCT_DETAIL_SLIDES: DetailSlide[] = [
  { id: "tin", kind: "model" },
  {
    id: "caffeine-in-a-mint",
    kind: "image",
    src: "/brand/caffeine-in-a-mint.png",
    alt: "손에 들린 ritmore 민트 틴",
  },
]

/** 1개 상품 페이지만 쓰는 대표 사진. */
export const ONE_PACK_SLUG = "sample-a"
export const ONE_PACK_PHOTO = "/products/sample-a.png"

/** 3개 상품 페이지만 쓰는 대표 사진. */
export const THREE_PACK_SLUG = "sample-a-3"
export const THREE_PACK_PHOTO = "/products/sample-a-3.png"

/** 6개 상품 페이지만 쓰는 대표 사진. */
export const SIX_PACK_SLUG = "sample-a-6"
export const SIX_PACK_PHOTO = "/products/sample-a-6.png"

const COVER_PHOTOS: Record<string, { src: string; alt: string }> = {
  [ONE_PACK_SLUG]: { src: ONE_PACK_PHOTO, alt: "ritmore 카페인 민트 캔디 1개" },
  [THREE_PACK_SLUG]: { src: THREE_PACK_PHOTO, alt: "ritmore 카페인 민트 캔디 3개" },
  [SIX_PACK_SLUG]: { src: SIX_PACK_PHOTO, alt: "ritmore 카페인 민트 캔디 6개" },
}

export function coverPhotoFor(slug: string) {
  return COVER_PHOTOS[slug]?.src ?? null
}

export function detailSlidesFor(slug: string): DetailSlide[] {
  const cover = COVER_PHOTOS[slug]
  if (!cover) return PRODUCT_DETAIL_SLIDES
  return [
    {
      id: `${slug}-cover`,
      kind: "image",
      src: cover.src,
      alt: cover.alt,
      fit: slug === SIX_PACK_SLUG ? "cover" : "contain",
    },
    ...PRODUCT_DETAIL_SLIDES,
  ]
}
