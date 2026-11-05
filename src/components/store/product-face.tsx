import { TinModel } from "@/components/store/tin-model"
import { cn } from "@/lib/utils"

const LID = { main: "/products/ritmore-lid.png", extra: "/products/ritmore-lid.png" }

const SHOTS: Record<string, { main: string; extra: string }> = {
  ritmore: LID,
  energy: LID,
  sand: LID,
  extra: LID,
  sage: LID,
  calm: LID,
  clay: LID,
}

export function productShots(tone: string) {
  return SHOTS[tone] ?? LID
}

export function TinMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2.5 shrink-0 rounded-full bg-[#BDE3FF]", className)}
    />
  )
}

export function ProductFace({
  tone,
  name,
  alt,
  className,
  aspectClass = "aspect-square",
  shot = "main",
  interactive = false,
}: {
  tone: string
  name: string
  alt?: string
  className?: string
  aspectClass?: string
  shot?: "main" | "extra"
  interactive?: boolean
}) {
  return (
    <div data-tone={tone} className={cn("overflow-hidden bg-white", aspectClass, className)}>
      <TinModel
        interactive={interactive}
        orbit={shot === "extra" ? "12deg 58deg auto" : "32deg 68deg auto"}
        label={alt ?? `${name}. 페퍼민트 12개입 슬라이드 틴`}
      />
    </div>
  )
}
