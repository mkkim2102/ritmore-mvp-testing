import Link from "next/link"
import { CartButton } from "@/components/store/cart-button"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function StoreHeader() {
  return (
    <div data-store-header className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur">
      <header className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:h-16">
        <Link href="/" className="inline-flex items-center">
          <img src="/brand/ritmore.svg" alt="ritmore" className="h-6 w-auto md:h-7" />
        </Link>
        <nav className="flex items-center gap-3 text-sm font-medium text-[#111111] md:gap-6">
          <Link href="/brand">브랜드</Link>
          <Link href="/products">상품</Link>
          <CartButton />
          <Link
            href="/products"
            data-header-buy
            className={cn(
              buttonVariants({ size: "lg" }),
              "hidden h-12 min-w-48 border-[#17364A] bg-[#17364A] px-6 text-base text-white hover:bg-[#17364A]/90 lg:inline-flex",
            )}
          >
            구매하러가기
          </Link>
        </nav>
      </header>
    </div>
  )
}
