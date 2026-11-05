import { isTinBundle } from "@/lib/bundles"
import { PRODUCT_DETAIL_COPY } from "@/lib/product-detail-copy"
import type { Product } from "@/lib/types"

export type Feature = { no: string; title: string; body: string }
export type Review = { name: string; score: string; date: string; product: string; body: string }

export type Landing = {
  eyebrow: string
  promise: string
  badges: string[]
  flavors: string[]
  features: Feature[]
  reviews: Review[]
  shipping: string
}

const reviews: Review[] = [
  {
    name: "미나",
    score: "5.0",
    date: "2026.10.28",
    product: "ritmore 카페인 민트 캔디",
    body: "공부할 때 책상 옆에 둡니다. 페퍼민트 맛이 깔끔하고 틴이 자리를 많이 차지하지 않습니다.",
  },
  {
    name: "크리스",
    score: "4.0",
    date: "2026.10.21",
    product: "ritmore 카페인 민트 캔디",
    body: "야간에 실습하면서 꺼내 먹습니다. 얇은 슬라이드 틴이라 필통에 들어갑니다.",
  },
  {
    name: "수아",
    score: "5.0",
    date: "2026.10.16",
    product: "ritmore 카페인 민트 캔디",
    body: "강의 사이에 한 개씩 녹입니다. 페퍼민트가 짧게 남고 단맛이 세지 않습니다.",
  },
  {
    name: "준",
    score: "4.0",
    date: "2026.10.09",
    product: "ritmore 카페인 민트 캔디",
    body: "가방 앞주머니에 넣어 둡니다. 뚜껑이 밀리는 방식이라 한 손으로 열립니다.",
  },
  {
    name: "하린",
    score: "5.0",
    date: "2026.10.02",
    product: "ritmore 카페인 민트 캔디",
    body: "밤샘 과제를 할 때 물과 같이 먹습니다. 맛이 과하지 않아서 여러 개를 먹기 편합니다.",
  },
  {
    name: "도윤",
    score: "4.0",
    date: "2026.09.26",
    product: "ritmore 카페인 민트 캔디",
    body: "실습실 책상 모서리에 둡니다. 틴이 얇아서 노트 옆에 잘 붙습니다.",
  },
  {
    name: "예린",
    score: "5.0",
    date: "2026.09.18",
    product: "ritmore 카페인 민트 캔디",
    body: "통학할 때 코트 주머니에 넣습니다. 흔들려도 뚜껑이 쉽게 열리지는 않았습니다.",
  },
  {
    name: "민재",
    score: "4.0",
    date: "2026.09.11",
    product: "ritmore 카페인 민트 캔디",
    body: "오후 수업 전에 두 개 정도 먹습니다. 페퍼민트가 입안을 정리해 줍니다.",
  },
  {
    name: "서연",
    score: "5.0",
    date: "2026.09.04",
    product: "ritmore 카페인 민트 캔디",
    body: "도서관 자리에서 씁니다. 뚜껑 소리가 거의 없어서 꺼내기가 편합니다.",
  },
]

const stories: Record<string, Landing> = {
  "sample-a": {
    eyebrow: "페퍼민트",
    promise: PRODUCT_DETAIL_COPY.promise,
    badges: [...PRODUCT_DETAIL_COPY.badges],
    flavors: [],
    features: PRODUCT_DETAIL_COPY.features,
    reviews,
    shipping: PRODUCT_DETAIL_COPY.shipping,
  },
}

export function landingFor(product: Product): Landing {
  if (isTinBundle(product.slug)) return stories["sample-a"]
  return (
    stories[product.slug] ?? {
      eyebrow: product.category,
      promise: product.summary,
      badges: ["민트"],
      flavors: [],
      features: [
        { no: "01", title: "제품", body: product.description || product.summary },
        { no: "02", title: "구매", body: "구매하기에서 수량과 구성을 확인한 뒤 주문으로 이어갑니다." },
        { no: "03", title: "안내", body: "배송과 교환, 환불은 주문 화면의 안내를 따릅니다." },
      ],
      reviews,
      shipping: "배송비와 배송 기간은 주문 화면의 안내를 따릅니다.",
    }
  )
}

export function homeReviews() {
  return reviews
}
