import type { Metadata } from "next"
import { productPath } from "@/lib/bundles"

/**
 * 검색에 나가기 전에 사이트가 알아야 하는 값.
 *
 * NEXT_PUBLIC_SITE_URL
 *   공개 주소의 https 원점. 비우면 로컬 링크용으로 http://127.0.0.1:43117 만 쓴다.
 *   그 로컬 주소로 검색 엔진에 올리지 않는다.
 *
 * NEXT_PUBLIC_SITE_INDEXABLE
 *   정확히 "true" 일 때만 공개 페이지 색인을 허용한다.
 *   비우거나 다른 값이면 noindex, nofollow 이고 robots.txt 는 전체를 막는다.
 *   연습 상점은 끄고, 실제 공개 상점을 배포할 때만 켠다.
 *   NEXT_PUBLIC_ 값은 빌드에 박히므로 바꾼 뒤에는 다시 빌드한다.
 *
 * GOOGLE_SITE_VERIFICATION, NAVER_SITE_VERIFICATION
 *   각 검색 콘솔에서 받은 코드가 있을 때만 메타 태그를 만든다. 코드를 지어내지 않는다.
 */

export const SITE_NAME = "ritmore"
export const SITE_NAME_KO = "리트모어"
const LOCAL_ORIGIN = "http://127.0.0.1:43117"

export const HOME_TITLE = "리트모어 | 페퍼민트 슬라이드 틴"
export const HOME_DESCRIPTION =
  "커피 한 잔은 많고, 조금은 더 필요할 때. 리트모어 페퍼민트 12개입 슬라이드 틴입니다."
export const PRODUCTS_TITLE = "상품 | 리트모어"
export const PRODUCTS_DESCRIPTION = "리트모어에서 지금 볼 수 있는 페퍼민트 슬라이드 틴입니다."
export const DEFAULT_SHARE_IMAGE = "/products/ritmore-lid.png"
export const SHARE_IMAGE_ALT = "리트모어 페퍼민트 12개입 슬라이드 틴 뚜껑"

const FORBIDDEN_CLAIM = /\d+\s*mg|00\s*mg|00\s*g|뉴로|\bneuro\b|your rhythm|테아닌|l-theanine/i

export function siteOrigin() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!raw) return LOCAL_ORIGIN
  try {
    return new URL(raw).origin
  } catch {
    return LOCAL_ORIGIN
  }
}

export function absoluteUrl(path = "/") {
  const origin = siteOrigin()
  if (!path || path === "/") return `${origin}/`
  const normalized = path.startsWith("/") ? path : `/${path}`
  const pathname = normalized.split(/[?#]/)[0] || "/"
  return `${origin}${pathname}`
}

export function isSiteIndexable() {
  return process.env.NEXT_PUBLIC_SITE_INDEXABLE === "true"
}

export function allowIndex() {
  return isSiteIndexable()
}

export function productTitle(name: string) {
  const label = name.trim() || SITE_NAME_KO
  return `${label} | ${SITE_NAME_KO}`
}

export function productMetaDescription(name: string, summary: string) {
  const label = name.trim() || SITE_NAME_KO
  const clean = summary.trim()
  if (clean && !FORBIDDEN_CLAIM.test(clean) && !FORBIDDEN_CLAIM.test(label)) {
    return `${label}. ${clean}`
  }
  return `${label}. 페퍼민트 12개입 슬라이드 틴입니다.`
}

export function productImageAlt(name: string) {
  const label = name.trim() || SITE_NAME_KO
  return `${label}. 페퍼민트 12개입 슬라이드 틴 뚜껑`
}

function robotsFor(index: boolean): Metadata["robots"] {
  return index ? { index: true, follow: true } : { index: false, follow: false }
}

function verification(): Metadata["verification"] | undefined {
  const google = process.env.GOOGLE_SITE_VERIFICATION?.trim()
  const naver = process.env.NAVER_SITE_VERIFICATION?.trim()
  if (!google && !naver) return undefined
  return {
    ...(google ? { google } : {}),
    ...(naver ? { other: { "naver-site-verification": naver } } : {}),
  }
}

export function rootMetadata(): Metadata {
  const origin = siteOrigin()
  const verified = verification()
  return {
    metadataBase: new URL(origin),
    title: {
      default: HOME_TITLE,
      template: `%s | ${SITE_NAME_KO}`,
    },
    description: HOME_DESCRIPTION,
    applicationName: SITE_NAME,
    robots: robotsFor(isSiteIndexable()),
    ...(verified ? { verification: verified } : {}),
    openGraph: {
      type: "website",
      locale: "ko_KR",
      siteName: SITE_NAME,
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
      url: `${origin}/`,
      images: [{ url: DEFAULT_SHARE_IMAGE, alt: SHARE_IMAGE_ALT }],
    },
    twitter: {
      card: "summary_large_image",
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
      images: [DEFAULT_SHARE_IMAGE],
    },
  }
}

export function publicMetadata({
  title,
  description,
  path,
  imagePath = DEFAULT_SHARE_IMAGE,
  imageAlt = SHARE_IMAGE_ALT,
  index,
}: {
  title: string
  description: string
  path: string
  imagePath?: string
  imageAlt?: string
  index: boolean
}): Metadata {
  const url = absoluteUrl(path)
  return {
    title: { absolute: title },
    description,
    robots: robotsFor(index),
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "ko_KR",
      siteName: SITE_NAME,
      title,
      description,
      url,
      images: [{ url: imagePath, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imagePath],
    },
  }
}

export function privateMetadata(title: string, description: string): Metadata {
  return {
    title,
    description,
    robots: { index: false, follow: false },
  }
}

/**
 * 가격은 상품 기본가(진열가)다. 실험 링크가 덮어쓴 금액은 넣지 않는다.
 * 별점, 후기 수, 카페인 mg 는 넣지 않는다.
 */
export function productStructuredData(input: {
  name: string
  slug: string
  basePrice: number
  imagePath: string
  summary: string
}) {
  const origin = siteOrigin()
  const name = input.name.trim() || SITE_NAME_KO
  const description = productMetaDescription(name, input.summary)
  const pageUrl = absoluteUrl(productPath(input.slug))
  const brandId = `${origin}/#brand`
  const product: Record<string, unknown> = {
    "@type": "Product",
    name,
    description,
    image: absoluteUrl(input.imagePath),
    url: pageUrl,
    brand: { "@id": brandId },
  }
  if (Number.isFinite(input.basePrice)) {
    product.offers = {
      "@type": "Offer",
      url: pageUrl,
      priceCurrency: "KRW",
      price: String(input.basePrice),
      availability: "https://schema.org/OutOfStock",
    }
  }
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${origin}/#organization`,
        name: SITE_NAME,
        alternateName: SITE_NAME_KO,
        url: `${origin}/`,
      },
      {
        "@type": "Brand",
        "@id": brandId,
        name: SITE_NAME,
        alternateName: SITE_NAME_KO,
        url: `${origin}/`,
      },
      product,
    ],
  }
}

export function jsonLdScript(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}
