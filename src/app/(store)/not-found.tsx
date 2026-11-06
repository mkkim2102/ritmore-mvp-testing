import Link from "next/link"
import { privateMetadata } from "@/lib/seo"

export const metadata = privateMetadata("없는 제품", "이 주소는 검색 결과에 올리지 않습니다.")

export default function StoreNotFound() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-3 px-4 py-16">
      <h1 className="font-serif text-4xl">이 제품은 없습니다</h1>
      <p className="text-muted-foreground">주소가 바뀌었거나 숨긴 상품입니다.</p>
      <Link href="/products/buy1" className="text-sm underline-offset-4 hover:underline">
        제품으로
      </Link>
    </div>
  )
}
