import type { Metadata } from "next"
import { ProjectSurvey } from "@/components/store/project-survey"
import { Tracker } from "@/components/store/tracker"
import { parseItems, priceLines } from "@/lib/catalog"
import { getRequestContext } from "@/lib/request"
import { publicMetadata } from "@/lib/seo"

export const metadata: Metadata = publicMetadata({
  title: "이 시험 | 리트모어",
  description: "리트모어 연습 상점이 무엇을 시험하는지 알리고, 짧은 질문을 받습니다.",
  path: "/project",
  index: false,
})

export default async function ProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ items?: string | string[] }>
}) {
  const query = await searchParams
  const raw = Array.isArray(query.items) ? query.items[0] : query.items
  const context = await getRequestContext()
  const line = priceLines(parseItems(raw), context.touch)[0]

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 px-4 py-10">
      <Tracker />
      <div className="space-y-4">
        <p className="text-xs font-medium text-muted-foreground">이 시험</p>
        <h1 className="text-3xl leading-tight text-[#111111]">구매는 되지 않습니다.</h1>
        <div className="space-y-3 text-sm leading-7 text-[#111111]">
          <p>
            ritmore는 페퍼민트 맛 카페인 민트 캔디를 12개입 슬라이드 틴으로 시험하는 연습 상점입니다. 커피 한 잔은
            많고, 조금은 더 필요할 때를 말투로 두고 있습니다. 한 알의 카페인 함량은 아직 정하지 않았습니다.
          </p>
          <p>
            이 사이트는 손님이 첫 화면에서 제품을 보고, 구매하기를 눌러 수량을 고른 뒤, 한 번 더 눌러야 여기까지
            오는지 보는 시험입니다. 두 번째 누름은 첫 누름으로 구매가 끝나지 않게 하려는 장치입니다.
          </p>
          <p>카드는 청구되지 않고, 주문과 배송은 만들어지지 않습니다. 이름과 연락처는 받지 않습니다.</p>
        </div>
      </div>
      <ProjectSurvey
        items={raw || ""}
        name={line?.product.name ?? null}
        qty={line?.qty ?? null}
        price={line?.offer.price ?? null}
      />
    </div>
  )
}
