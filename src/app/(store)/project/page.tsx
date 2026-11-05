import type { Metadata } from "next"
import { ProjectSurvey } from "@/components/store/project-survey"
import { Tracker } from "@/components/store/tracker"
import { publicMetadata } from "@/lib/seo"

const INTRO = [
  "리트모어는 “집중은 필요한데, 커피 한 잔, 에너지 음료 한 캔은 부담스러울 때”를 위해 5명의 고려대학교 학생들이 기획한 카페인 민트입니다. 소비자들이 현재 카페인을 얼마나 섭취하는지 명확히 인지하고, 상황에 맞게 섭취량을 조절할 수 있는 선택지를 만들고 싶었습니다.",
  "현재 보신 페이지는 제품 출시 전, 고객 반응을 확인하기 위한 테스트 페이지입니다. 아직 판매가 시작되지 않아 주문이나 결제는 이루어지지 않았습니다. 구매 버튼을 누른 뒤에야 안내드리게 된 점 양해 부탁드립니다.",
  "저희는 이런 제품이 실제로 필요한지, 제안한 구성과 가격이 구매를 고려할 만큼 매력적인지 알고 싶었습니다. 여러분의 반응은 리트모어의 출시 여부와 제품 방향을 결정하는 데 참고할 예정입니다. 제품은 생산이 완료되는 대로 곧 출시될 예정입니다.",
  "시간을 내어 리트모어를 살펴봐 주셔서 감사드리며, 저희가 여러분을 위해 더 나은 제품을 만들 수 있도록, 여유가 되신다면 아래 설문 작성을 부탁드립니다.",
] as const

export const metadata: Metadata = publicMetadata({
  title: "리트모어에 관심을 가져주셔서 감사합니다 | 리트모어",
  description: "현재 구매는 이루어지지 않습니다. 제품 출시 전 고객 반응을 확인하는 페이지입니다.",
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

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 px-4 py-10 sm:px-6 sm:py-14">
      <Tracker />
      <div className="space-y-4 text-base leading-7 text-[#111111]">
        <h1 className="text-base leading-7 font-normal">
          리트모어에 관심을 가져주셔서 감사합니다. 현재 구매는 이루어지지 않습니다.
        </h1>
        {INTRO.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-base leading-7 font-medium">어떤 점이 마음에 드셨나요?</h2>
          <p className="text-sm leading-6 text-muted-foreground">짧은 답변으로 리트모어의 다음 모습을 함께 만들어 주세요.</p>
        </div>
        <ProjectSurvey items={raw || ""} />
      </section>
    </div>
  )
}
