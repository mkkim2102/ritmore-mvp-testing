import type { ReactNode } from "react"
import { privateMetadata } from "@/lib/seo"

export const metadata = privateMetadata("운영 화면", "운영 화면은 검색 결과에 올리지 않습니다.")

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return children
}
