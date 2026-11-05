import Link from "next/link"

export function StoreFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-white text-[#111111]">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#666666]">
          <Link href="/brand" className="hover:text-[#111111]">
            브랜드
          </Link>
          <Link href="/products/sample-a" className="hover:text-[#111111]">
            ritmore 카페인 민트 캔디
          </Link>
        </nav>
      </div>
    </footer>
  )
}
