import type { Metadata } from "next"
import { BrandStory } from "@/components/store/brand-story"
import { allowIndex, publicMetadata } from "@/lib/seo"

export const metadata: Metadata = publicMetadata({
  title: "브랜드 | 리트모어",
  description: "내 리듬에 맞게, 나의 페이스대로. your rhythm, your pace.",
  path: "/brand",
  index: allowIndex(),
})

export default function BrandPage() {
  return <BrandStory />
}
