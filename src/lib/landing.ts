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
    name: "yz*****",
    score: "5.0",
    date: "2026.11.04",
    product: "ritmore 카페인 민트 캔디",
    body: "점심 먹고 커피 한 잔 더 마시기는 부담스러워서 먹어봤어요. 민트 맛이라 입안도 개운하네요.",
  },
  {
    name: "hh*****",
    score: "5.0",
    date: "2026.11.03",
    product: "ritmore 카페인 민트 캔디",
    body: "헐 생각보다 작고 얇아서 놀랐어요. 외출할 때 가방에 하나 넣어두기 좋을 것 같아요!",
  },
  {
    name: "kk*****",
    score: "5.0",
    date: "2026.11.02",
    product: "ritmore 카페인 민트 캔디",
    body: "처음 먹어봤는데 한 알 꺼내 먹고 다시 닫아두면 되니까 간단해요. 남은 음료 들고 다니기 귀찮았는데, 이 점이 괜찮은 것 같아요",
  },
  {
    name: "jc*****",
    score: "5.0",
    date: "2026.11.01",
    product: "ritmore 카페인 민트 캔디",
    body: "친구가 꺼내 먹길래 궁금해서 먹어봤어요. 카페인을 사탕처럼 먹는 건 처음 보는데 꽤 괜찮은 것 같아요 ㅎㅎ",
  },
  {
    name: "sy*****",
    score: "5.0",
    date: "2026.10.31",
    product: "ritmore 카페인 민트 캔디",
    body: "민트 캔디를 원래 좋아해서 거부감 없이 먹었어요. 다만 카페인 들어 있으니까 일반 사탕처럼 계속 먹지 않게 신경 쓰고 있어요.",
  },
  {
    name: "ma*****",
    score: "5.0",
    date: "2026.10.30",
    product: "ritmore 카페인 민트 캔디",
    body: "음료는 마시다 남기는 경우가 많았는데 이건 남은 걸 다시 닫아두면 되니까 편해요.",
  },
  {
    name: "mk****",
    score: "5.0",
    date: "2026.10.29",
    product: "ritmore 카페인 민트 캔디",
    body: "오전에 커피를 마신 날은 오후에 한 잔 더 주문하기 망설여졌거든요. 그럴 때 이거 먹으니까 하루치 카페인을 조절할 수 있어서 좋았어요.",
  },
  {
    name: "sa*****",
    score: "5.0",
    date: "2026.10.28",
    product: "ritmore 카페인 민트 캔디",
    body: "커피의 쓴맛을 별로 안 좋아해서 매번 라떼 먹거나 그랬는데, 당류가 걱정됐거든요.. 그런데 민트맛으로 당류 걱정없이 카페인 먹을 수 있어서 좋아요!",
  },
  {
    name: "ji*****",
    score: "5.0",
    date: "2026.10.27",
    product: "ritmore 카페인 민트 캔디",
    body: "버스 탈 때 음료 때문에 그냥 빨리 마시고 다음 버스 이용했었는데, 이건 주머니에 넣으면 끝이라 편해요.",
  },
  {
    name: "yio*****",
    score: "5.0",
    date: "2026.10.26",
    product: "ritmore 카페인 민트 캔디",
    body: "카페인 캔디라 맛이 좀 약 같을 줄 알았는데 생각보다 익숙한 민트 맛이었어요. 이런 거 처음 봐서 신기해요",
  },
  {
    name: "kq*****",
    score: "5.0",
    date: "2026.10.25",
    product: "ritmore 카페인 민트 캔디",
    body: "평소 들고 다니는 파우치에 넣어봤는데 딱 들어가요. 짐 늘어나는 걸 싫어해서 이 부분이 마음에 들었어요.",
  },
  {
    name: "tr*****",
    score: "5.0",
    date: "2026.10.24",
    product: "ritmore 카페인 민트 캔디",
    body: "저녁 먹고 공부를 더 해야 하는데 커피 한 잔을 다 마시기는 부담스럽더라고요. 이건 한 알씩 먹을 수 있어서 선택하기 편했어요.",
  },
  {
    name: "sn*****",
    score: "5.0",
    date: "2026.10.23",
    product: "ritmore 카페인 민트 캔디",
    body: "커피는 마시고 싶은데 시키면 꼭 절반쯤 남겨요. 이건 한 알 먹고 나머지는 닫아둘 수 있어서 제 스타일이에요.",
  },
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
