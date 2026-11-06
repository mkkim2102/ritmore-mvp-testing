"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { buttonVariants } from "@/components/ui/button"
import { submitReviewAction } from "@/lib/community-actions"
import { cn } from "@/lib/utils"

const initial = { ok: false, error: "", nonce: "" }

export function ReviewForm({ slug }: { slug: string }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [state, action, pending] = useActionState(submitReviewAction, initial)
  const [body, setBody] = useState("")
  const [name, setName] = useState("")
  const seen = useRef("")

  useEffect(() => {
    if (!state.nonce || seen.current === state.nonce) return
    seen.current = state.nonce
    setBody("")
    setName("")
    formRef.current?.reset()
    router.refresh()
  }, [state.nonce, router])

  return (
    <form
      ref={formRef}
      action={action}
      className="mt-8 max-w-xl space-y-4 rounded-3xl border border-border bg-white p-5"
      data-review-form
    >
      <input type="hidden" name="slug" value={slug} />
      <h3 className="font-medium">후기 남기기</h3>
      <p className="text-sm text-muted-foreground">작성한 후기는 상품 페이지에 공개되지 않습니다.</p>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">
          별점 <span className="font-normal text-muted-foreground">필수, 1에서 5</span>
        </legend>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((score) => (
            <label
              key={score}
              className="flex h-12 flex-1 cursor-pointer items-center justify-center rounded-xl border border-[#e5e5e5] text-base has-[:checked]:border-[#111111] has-[:checked]:bg-[#111111] has-[:checked]:text-white"
            >
              <input className="sr-only" type="radio" name="score" value={score} aria-label={`${score}점`} required />
              {score}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block space-y-2 text-sm" htmlFor="review-body">
        <span className="font-medium">
          후기 글 <span className="font-normal text-muted-foreground">필수, 500자</span>
        </span>
        <textarea
          id="review-body"
          name="body"
          required
          maxLength={500}
          rows={4}
          value={body}
          onChange={(event) => setBody(event.target.value.slice(0, 500))}
          className="w-full rounded-xl border border-[#e5e5e5] bg-white px-3 py-3 text-base leading-6"
        />
        <span className="block text-xs text-muted-foreground tabular-nums">{body.length} / 500</span>
      </label>
      <label className="block space-y-2 text-sm" htmlFor="review-name">
        <span className="font-medium">
          이름 <span className="font-normal text-muted-foreground">선택, 20자</span>
        </span>
        <input
          id="review-name"
          name="name"
          maxLength={20}
          value={name}
          onChange={(event) => setName(event.target.value.slice(0, 20))}
          autoComplete="name"
          className="h-12 w-full rounded-xl border border-[#e5e5e5] bg-white px-3 text-base"
        />
      </label>
      {state.error ? (
        <p className="text-sm text-red-700" role="alert" data-review-error>
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="text-sm" data-review-saved>
          후기를 남겼습니다.
        </p>
      ) : null}
      <button
        type="submit"
        className={cn(
          buttonVariants(),
          "h-12 w-full border-[#17364A] bg-[#17364A] text-base text-white hover:bg-[#17364A]/90",
        )}
        disabled={pending}
      >
        {pending ? "남기는 중" : "후기 남기기"}
      </button>
    </form>
  )
}
