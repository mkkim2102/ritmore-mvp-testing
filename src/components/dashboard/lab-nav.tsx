"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const ITEMS = [
  { href: "/dashboard/master", label: "마스터" },
  { href: "/dashboard/inquiries", label: "문의" },
  { href: "/dashboard/funnel", label: "퍼널" },
  { href: "/dashboard/customers", label: "고객" },
  { href: "/dashboard/surveys", label: "설문" },
  { href: "/dashboard", label: "요약" },
  { href: "/dashboard/links", label: "링크" },
  { href: "/dashboard/products", label: "상품" },
  { href: "/dashboard/events", label: "기록" },
]

export function LabNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 overflow-x-auto">
      {ITEMS.map((item) => {
        const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm whitespace-nowrap",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
