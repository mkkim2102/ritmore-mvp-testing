"use client"

import { useState } from "react"
import { buttonVariants } from "@/components/ui/button"
import { BUY_LIKES, BUY_REASONS, OTHER_REASON } from "@/lib/survey-options"
import { cn } from "@/lib/utils"

const brandNavy = "border-[#17364A] bg-[#17364A] text-white hover:bg-[#17364A]/90"

export function ProjectSurvey({ items }: { items: string }) {
  const [reason, setReason] = useState<(typeof BUY_REASONS)[number] | "">("")
  const [likes, setLikes] = useState<(typeof BUY_LIKES)[number][]>([])
  const [other, setOther] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  function toggleLike(option: (typeof BUY_LIKES)[number]) {
    setError("")
    setLikes((current) => {
      if (current.includes(option)) return current.filter((item) => item !== option)
      if (current.length >= 2) {
        setError("최대 2개를 선택해 주세요.")
        return current
      }
      return [...current, option]
    })
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!reason) {
      setError("이유를 하나 골라 주세요.")
      return
    }
    setPending(true)
    setError("")
    const response = await fetch("/api/survey", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        items,
        reason,
        likes,
        other: reason === OTHER_REASON ? other : "",
      }),
    })
    const json = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null
    setPending(false)
    if (!response.ok || !json?.ok) {
      setError(json?.error || "보내지 못했습니다. 다시 눌러 주세요.")
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <p className="text-sm leading-6" data-survey-done>
        답을 받았습니다. 이 답은 이름과 연락처 없이 시험 기록으로만 남습니다.
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-6" data-project-survey>
      <fieldset className="space-y-3">
        <legend className="text-base leading-7 font-medium">1. 방금 &apos;구매하기&apos;를 누른 가장 큰 이유는 무엇인가요?</legend>
        <p className="text-sm leading-6 text-muted-foreground">하나만 선택해 주세요.</p>
        <div className="space-y-2.5" role="radiogroup" aria-label="구매하기를 누른 이유">
          {BUY_REASONS.map((option) => (
            <label key={option} className="flex items-start gap-2.5 text-sm leading-6">
              <input
                type="radio"
                name="reason"
                value={option}
                checked={reason === option}
                onChange={() => {
                  setReason(option)
                  setError("")
                }}
                className="mt-1 size-4 accent-[#17364A]"
                data-buy-reason={option}
              />
              {option === OTHER_REASON ? (
                <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                  <span>기타</span>
                  <input
                    type="text"
                    value={other}
                    maxLength={500}
                    aria-label="기타 이유"
                    onFocus={() => setReason(OTHER_REASON)}
                    onChange={(event) => {
                      setReason(OTHER_REASON)
                      setOther(event.target.value.slice(0, 500))
                      setError("")
                    }}
                    className="h-8 min-w-28 flex-1 border-0 border-b border-[#111111] bg-transparent px-1 text-sm outline-none"
                  />
                </span>
              ) : (
                <span>{option}</span>
              )}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-base leading-7 font-medium">2. 리트모어의 어떤 점이 가장 마음에 드셨나요?</legend>
        <p className="text-sm leading-6 text-muted-foreground">최대 2개를 선택해 주세요.</p>
        <div className="space-y-2.5">
          {BUY_LIKES.map((option) => {
            const checked = likes.includes(option)
            return (
              <label key={option} className="flex items-start gap-2.5 text-sm leading-6">
                <input
                  type="checkbox"
                  name="likes"
                  value={option}
                  checked={checked}
                  onChange={() => toggleLike(option)}
                  className="mt-1 size-4 accent-[#17364A]"
                  data-buy-like={option}
                />
                <span>{option}</span>
              </label>
            )
          })}
        </div>
      </fieldset>

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className={cn(buttonVariants(), brandNavy, "h-12 w-full text-base")} disabled={pending}>
        {pending ? "보내는 중" : "답 보내기"}
      </button>
    </form>
  )
}
