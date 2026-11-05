import Link from "next/link"
import { privateMetadata } from "@/lib/seo"

export const metadata = privateMetadata("없는 페이지", "이 주소는 검색 결과에 올리지 않습니다.")

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center gap-3 px-4">
      <h1 className="font-serif text-4xl">없는 페이지입니다</h1>
      <p className="text-muted-foreground">주소가 바뀌었거나 숨긴 상품일 수 있습니다.</p>
      <Link href="/" className="text-sm underline-offset-4 hover:underline">
        홈으로
      </Link>
    </div>
  )
}
