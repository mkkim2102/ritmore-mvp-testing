/** 상세 갤러리 공통 슬라이드. 3D 틴이 첫 화면이고, 사진은 뒤에 둔다. */
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
  const model = PRODUCT_DETAIL_SLIDES.find((slide) => slide.kind === "model")
  const photos = PRODUCT_DETAIL_SLIDES.filter((slide) => slide.kind !== "model")
  const coverSlide: DetailSlide = {
    id: `${slug}-cover`,
    kind: "image",
    src: cover.src,
    alt: cover.alt,
    fit: "cover",
  }
  // 첫 화면은 기울인 3D 틴. 팩 사진과 나머지 컷은 그 다음 슬라이드다.
  return model ? [model, coverSlide, ...photos] : [coverSlide, ...photos]
}
