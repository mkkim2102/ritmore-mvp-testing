"use client"

import { useState } from "react"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { won } from "@/lib/format"
import { cn } from "@/lib/utils"

export type CheckoutLine = {
  slug: string
  name: string
  qty: number
  price: number
}

const METHODS = [
  { id: "card", label: "카드" },
  { id: "easy", label: "간편결제" },
  { id: "transfer", label: "계좌이체" },
] as const

export function CheckoutForm({ lines }: { lines: CheckoutLine[] }) {
  const [method, setMethod] = useState<(typeof METHODS)[number]["id"]>("card")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const total = lines.reduce((sum, line) => sum + line.price * line.qty, 0)

  function rememberPay() {
    const nameFilled = name.trim().length > 0
    const phoneFilled = phone.trim().length > 0
    for (const line of lines) {
      void fetch("/api/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          step: "pay_click",
          path: "/checkout",
          productSlug: line.slug,
          qty: line.qty,
          method,
          nameFilled,
          phoneFilled,
        }),
      }).catch(() => undefined)
    }
  }

  return (
    <div className="space-y-6">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">결제 수단</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {METHODS.map((item) => (
            <label
              key={item.id}
              className={`flex h-11 cursor-pointer items-center justify-center rounded-lg border text-sm ${
                method === item.id ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              <input
                type="radio"
                name="method"
                value={item.id}
                checked={method === item.id}
                onChange={() => setMethod(item.id)}
                className="sr-only"
              />
              {item.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="buyer-name">이름</Label>
          <Input
            id="buyer-name"
            className="h-11"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="off"
            placeholder="이름을 입력해 주세요"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="buyer-phone">연락처</Label>
          <Input
            id="buyer-phone"
            className="h-11"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            autoComplete="off"
            placeholder="연락처를 입력해 주세요"
          />
        </div>
      </div>
      <div className="flex items-end justify-between border-t border-border pt-4">
        <p className="text-sm text-muted-foreground">합계</p>
        <p className="text-2xl font-semibold tabular-nums">{won(total)}</p>
      </div>
      <a href="/checkout/done" className={cn(buttonVariants(), "h-12 w-full text-base")} onClick={rememberPay}>
        결제하기
      </a>
    </div>
  )
}
