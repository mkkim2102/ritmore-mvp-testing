import { cn } from "@/lib/utils"

export const JOURNEY_STEPS = ["도착", "수량", "상세", "장바구니", "주문 확인", "완료"] as const

export type JourneyName = (typeof JOURNEY_STEPS)[number]

export function JourneyStep({ step, className }: { step: JourneyName; className?: string }) {
  return (
    <p
      data-journey-step={step}
      className={cn(
        "w-fit rounded-full border border-[#111111] bg-white px-2.5 py-1 text-[11px] font-semibold leading-none text-[#111111]",
        className,
      )}
    >
      {step}
    </p>
  )
}
