"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function CopyLink({ url }: { url: string }) {
  const [label, setLabel] = useState("주소 복사")

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url)
          setLabel("복사됨")
          window.setTimeout(() => setLabel("주소 복사"), 1400)
        } catch {
          setLabel("직접 선택해 복사")
        }
      }}
    >
      {label}
    </Button>
  )
}
