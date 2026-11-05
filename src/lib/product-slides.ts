/** 상세 갤러리 공통 슬라이드. 팩 페이지는 대표 사진이 첫 화면이다. */
export type DetailSlide =
  | { id: string; kind: "model" }
  | { id: string; kind: "image"; src: string; alt: string; fit?: "contain" | "cover"; position?: string }

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

const COVER_PHOTOS: Record<string, { src: string; alt: string; fit: "contain" | "cover"; position?: string }> = {
  // 제품이 사진 위쪽에 있다. 정사각 가운데 crop은 아래 여백만 넓혀 틴이 떠 보인다. 목록과 같은 위치.
  [ONE_PACK_SLUG]: { src: ONE_PACK_PHOTO, alt: "ritmore 카페인 민트 캔디 1개", fit: "cover", position: "center 8%" },
  [THREE_PACK_SLUG]: { src: THREE_PACK_PHOTO, alt: "ritmore 카페인 민트 캔디 3개", fit: "cover" },
  [SIX_PACK_SLUG]: { src: SIX_PACK_PHOTO, alt: "ritmore 카페인 민트 캔디 6개", fit: "cover" },
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
    fit: cover.fit,
    position: cover.position,
  }
  // 첫 화면은 대표 사진. 3D와 나머지 사진은 그 다음이다.
  return model ? [coverSlide, model, ...photos] : [coverSlide, ...photos]
}
