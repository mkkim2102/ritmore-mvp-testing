"use client"

import { useState } from "react"
import { buttonVariants } from "@/components/ui/button"
import { won } from "@/lib/format"
import { EASE, INTENT, SECOND_PRESS } from "@/lib/survey-options"
import { cn } from "@/lib/utils"

export function ProjectSurvey({
  items,
  name,
  qty,
  price,
}: {
  items: string
  name: string | null
  qty: number | null
  price: number | null
}) {
  const [ease, setEase] = useState<(typeof EASE)[number] | "">("")
  const [secondPress, setSecondPress] = useState<(typeof SECOND_PRESS)[number] | "">("")
  const [intent, setIntent] = useState<(typeof INTENT)[number] | "">("")
  const [note, setNote] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!ease || !secondPress || !intent) {
      setError("세 가지 질문을 골라 주세요.")
      return
    }
    setPending(true)
    setError("")
    const response = await fetch("/api/survey", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items, ease, secondPress, intent, note }),
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
      <p className="rounded-2xl border border-border bg-white p-5 text-sm leading-6" data-survey-done>
        답을 받았습니다. 이 답은 이름과 연락처 없이 시험 기록으로만 남습니다.
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-6 rounded-2xl border border-border bg-white p-5" data-project-survey>
      {name && qty && price ? (
        <p className="text-sm leading-6">
          고른 것은 {name} {qty}개, 실판매가 {won(price * qty)}입니다. 이 금액은 결제되지 않습니다.
        </p>
      ) : (
        <p className="text-sm leading-6 text-muted-foreground">수량을 고르지 않고 이 페이지에 왔습니다.</p>
      )}
      <Choice legend="흐름이 이해하기 쉬웠나요?" name="ease" options={EASE} value={ease} onChange={setEase} />
      <Choice
        legend="구매하기를 한 번 더 누르는 방식이 실수 방지에 도움이 됐나요?"
        name="second"
        options={SECOND_PRESS}
        value={secondPress}
        onChange={setSecondPress}
      />
      <Choice legend="이런 민트를 살 의향이 있나요?" name="intent" options={INTENT} value={intent} onChange={setIntent} />
      <label className="block space-y-2 text-sm">
        <span className="font-medium">더 남기고 싶은 말</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value.slice(0, 500))}
          rows={4}
          className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
          placeholder="없어도 됩니다."
        />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button type="submit" className={cn(buttonVariants(), "h-12 w-full")} disabled={pending}>
        {pending ? "보내는 중" : "답 보내기"}
      </button>
    </form>
  )
}

function Choice<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string
  name: string
  options: readonly T[]
  value: T | ""
  onChange: (value: T) => void
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option}
            className={cn(
              "cursor-pointer rounded-full border px-3 py-2 text-sm",
              value === option ? "border-[#111111] bg-[#111111] text-white" : "border-[#e5e5e5] bg-white",
            )}
          >
            <input
              className="sr-only"
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
            />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
