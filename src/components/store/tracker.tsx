"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import type { Step } from "@/lib/funnel"

export function Tracker({
  step,
  productSlug,
  productSlugList = "",
}: {
  step?: Step
  productSlug?: string
  productSlugList?: string
}) {
  const pathname = usePathname()

  useEffect(() => {
    const calls: { step: Step; productSlug?: string }[] = [{ step: "visit" }]
    if (step && step !== "visit") {
      const slugs = productSlugList
        ? productSlugList.split(",").filter(Boolean)
        : productSlug
          ? [productSlug]
          : [undefined]
      for (const slug of slugs) calls.push({ step, productSlug: slug })
    }

    let cancelled = false
    async function send() {
      for (const call of calls) {
        if (cancelled) return
        await fetch("/api/track", {
          method: "POST",
          headers: { "content-type": "application/json" },
          keepalive: true,
          body: JSON.stringify({ step: call.step, path: pathname, productSlug: call.productSlug }),
        }).catch(() => undefined)
      }
    }
    void send()
    return () => {
      cancelled = true
    }
  }, [pathname, productSlug, productSlugList, step])

  return null
}
