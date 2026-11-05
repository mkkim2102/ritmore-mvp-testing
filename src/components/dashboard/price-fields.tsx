"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { discountRate, won } from "@/lib/format"

function parseWon(text: string) {
  if (!/^\d+$/.test(text)) return null
  const value = Number(text)
  if (!Number.isInteger(value) || value > 10_000_000) return null
  return value
}

export function PriceFields({
  id,
  selling,
  list,
  sellingName = "basePrice",
  listName = "compareAt",
  separator = " · ",
}: {
  id: string
  selling: number
  list: number | null
  sellingName?: string
  listName?: string
  separator?: string
}) {
  const [sellingText, setSellingText] = useState(String(selling))
  const [listText, setListText] = useState(list == null ? "" : String(list))
  const sellingValue = parseWon(sellingText.trim())
  const listValue = listText.trim() === "" ? null : parseWon(listText.trim())
  const rate = sellingValue != null && (listText.trim() === "" || listValue != null) ? discountRate(listValue, sellingValue) : null

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={`compare-${id}`}>정가 (원)</Label>
        <Input
          id={`compare-${id}`}
          name={listName}
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          className="h-9"
          value={listText}
          onChange={(event) => setListText(event.target.value)}
          placeholder="없으면 비움"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`price-${id}`}>실판매가 (원)</Label>
        <Input
          id={`price-${id}`}
          name={sellingName}
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          className="h-9"
          value={sellingText}
          onChange={(event) => setSellingText(event.target.value)}
          required
        />
      </div>
      <p className="text-sm md:col-span-2" data-price-summary>
        정가 {listValue != null ? won(listValue) : listText.trim() === "" ? "없음" : "—"}
        {separator}
        실판매가 {sellingValue != null ? won(sellingValue) : "—"}
        {rate != null ? `${separator}${rate}%` : ""}
      </p>
    </>
  )
}
