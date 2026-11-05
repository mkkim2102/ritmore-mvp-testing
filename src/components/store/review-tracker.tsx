"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function ReviewTracker({ productSlug }: { productSlug: string }) {
  const pathname = usePathname()

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const tab = target.closest("a[href='#reviews']")
      const section = target.closest("#reviews")
      if (!tab && !section) return
      void fetch("/api/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          step: "review_click",
          path: pathname,
          productSlug,
        }),
      }).catch(() => undefined)
    }
    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, [pathname, productSlug])

  return null
}
