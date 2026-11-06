"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

type DwellPage = "home" | "product" | "cart" | "checkout"

function dwellPage(pathname: string): DwellPage | null {
  if (pathname === "/") return "home"
  if (pathname === "/cart") return "cart"
  if (pathname === "/purchase" || pathname === "/checkout") return "checkout"
  if (/^\/products\/[^/]+$/.test(pathname)) return "product"
  return null
}

export function DwellTracker() {
  const pathname = usePathname()

  useEffect(() => {
    const page = dwellPage(pathname)
    if (!page) return
    let last = performance.now()

    const flush = () => {
      const now = performance.now()
      const seconds = Math.round((now - last) / 1000)
      last = now
      if (seconds < 1) return
      void fetch("/api/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          step: "dwell",
          path: pathname,
          page,
          seconds: Math.min(seconds, 14400),
        }),
      }).catch(() => undefined)
    }

    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush()
    }
    window.addEventListener("pagehide", flush)
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      window.removeEventListener("pagehide", flush)
      document.removeEventListener("visibilitychange", onVisibility)
      flush()
    }
  }, [pathname])

  return null
}
