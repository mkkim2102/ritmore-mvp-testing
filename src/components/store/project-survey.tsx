"use client"

import { useState } from "react"
import { buttonVariants } from "@/components/ui/button"
import {
  BUY_CHECKS,
  BUY_LIKES,
  BUY_REASONS,
  OTHER_CHECK,
  OTHER_LIKE,
  OTHER_REASON,
  WHEN_PLACEHOLDER,
} from "@/lib/survey-options"
import { cn } from "@/lib/utils"

const brandNavy = "border-[#17364A] bg-[#17364A] text-white hover:bg-[#17364A]/90"
const MAX_PICKS = 2

export function ProjectSurvey({ items }: { items: string }) {
  const [reason, setReason] = useState<(typeof BUY_REASONS)[number] | "">("")
  const [likes, setLikes] = useState<(typeof BUY_LIKES)[number][]>([])
  const [checks, setChecks] = useState<(typeof BUY_CHECKS)[number][]>([])
  const [other, setOther] = useState("")
  const [likeOther, setLikeOther] = useState("")
  const [checkOther, setCheckOther] = useState("")
  const [whenText, setWhenText] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  function applyLimited<T extends string>(option: T, current: T[], set: (next: T[]) => void) {
    if (current.includes(option)) {
      setError("")
      set(current.filter((item) => item !== option))
      return
    }
    if (current.length >= MAX_PICKS) {
      setError("최대 2개를 선택해 주세요.")
      return
    }
    setError("")
    set([...current, option])
  }

  function toggleLike(option: (typeof BUY_LIKES)[number]) {
    applyLimited(option, likes, setLikes)
  }

  function toggleCheck(option: (typeof BUY_CHECKS)[number]) {
    applyLimited(option, checks, setChecks)
  }

  function focusLikeOther() {
    if (likes.includes(OTHER_LIKE)) return
    applyLimited(OTHER_LIKE, likes, setLikes)
  }

  function focusCheckOther() {
    if (checks.includes(OTHER_CHECK)) return
    applyLimited(OTHER_CHECK, checks, setChecks)
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!reason) {
      setError("이유를 하나 골라 주세요.")
      return
    }
    if (likes.length > MAX_PICKS || checks.length > MAX_PICKS) {
      setError("최대 2개를 선택해 주세요.")
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
        likeOther: likes.includes(OTHER_LIKE) ? likeOther : "",
        checks,
        checkOther: checks.includes(OTHER_CHECK) ? checkOther : "",
        when: whenText,
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
        <legend className="text-base leading-7 font-medium">1. 방금 ‘구매하기’를 누른 가장 큰 이유는 무엇인가요?</legend>
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
                {option === OTHER_LIKE ? (
                  <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                    <span>기타</span>
                    <input
                      type="text"
                      value={likeOther}
                      maxLength={500}
                      aria-label="기타 마음에 든 점"
                      onClick={(event) => {
                        event.preventDefault()
                        focusLikeOther()
                      }}
                      onFocus={focusLikeOther}
                      onChange={(event) => {
                        focusLikeOther()
                        setLikeOther(event.target.value.slice(0, 500))
                      }}
                      className="h-8 min-w-28 flex-1 border-0 border-b border-[#111111] bg-transparent px-1 text-sm outline-none"
                    />
                  </span>
                ) : (
                  <span>{option}</span>
                )}
              </label>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-base leading-7 font-medium">
          3. 구매를 결정하기 전에 더 확인하고 싶거나 망설여졌던 점은 무엇인가요?
        </legend>
        <p className="text-sm leading-6 text-muted-foreground">최대 2개를 선택해 주세요.</p>
        <div className="space-y-2.5">
          {BUY_CHECKS.map((option) => {
            const checked = checks.includes(option)
            return (
              <label key={option} className="flex items-start gap-2.5 text-sm leading-6">
                <input
                  type="checkbox"
                  name="checks"
                  value={option}
                  checked={checked}
                  onChange={() => toggleCheck(option)}
                  className="mt-1 size-4 accent-[#17364A]"
                  data-buy-check={option}
                />
                {option === OTHER_CHECK ? (
                  <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                    <span>기타</span>
                    <input
                      type="text"
                      value={checkOther}
                      maxLength={500}
                      aria-label="기타 확인하고 싶은 점"
                      onClick={(event) => {
                        event.preventDefault()
                        focusCheckOther()
                      }}
                      onFocus={focusCheckOther}
                      onChange={(event) => {
                        focusCheckOther()
                        setCheckOther(event.target.value.slice(0, 500))
                      }}
                      className="h-8 min-w-28 flex-1 border-0 border-b border-[#111111] bg-transparent px-1 text-sm outline-none"
                    />
                  </span>
                ) : (
                  <span>{option}</span>
                )}
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="space-y-3">
        <label htmlFor="survey-when" className="block text-base leading-7 font-medium">
          4. 리트모어를 언제, 어떤 상황에서 먹으려고 하셨나요?
        </label>
        <p className="text-sm leading-6 text-muted-foreground">선택 문항이에요. 짧게 적어 주세요.</p>
        <textarea
          id="survey-when"
          name="when"
          value={whenText}
          maxLength={500}
          rows={2}
          placeholder={WHEN_PLACEHOLDER}
          onChange={(event) => setWhenText(event.target.value.slice(0, 500))}
          className="w-full resize-none border-0 border-b border-[#111111] bg-transparent px-1 py-2 text-sm leading-6 outline-none placeholder:text-muted-foreground"
        />
      </div>

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
