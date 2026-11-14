import type { ReactNode } from "react"
import { StoreFooter } from "@/components/store/footer"
import { StoreHeader } from "@/components/store/header"

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <StoreHeader />
      <main className="w-full flex-1">{children}</main>
      <StoreFooter />
    </>
  )
}
