"use client"

import { useLayoutEffect, useRef, useState, type PointerEvent } from "react"
import { cn } from "@/lib/utils"

export type ReviewCard = {
  key: string
  id?: string
  source: "visitor" | "sample"
  name: string
  score: string
  date: string
  body: string
  image?: string
}

function cardsPerView(width: number) {
  if (width < 560) return 2
  if (width < 880) return 3
  return 5
}

function chunk(reviews: ReviewCard[], size: number) {
  const pages: ReviewCard[][] = []
  for (let index = 0; index < reviews.length; index += size) {
    pages.push(reviews.slice(index, index + size))
  }
  return pages
}

function oneLine(body: string) {
  return body.replace(/\s+/g, " ").trim()
}

function Stars({ score }: { score: string }) {
  const value = Math.max(0, Math.min(5, Math.round(Number(score) || 0)))
  return (
    <p className="mt-1 text-[11px] leading-none tracking-[0.14em]" aria-label={`별점 ${score}`}>
      {Array.from({ length: 5 }, (_, star) => (
        <span key={star} className={star < value ? "text-[#111111]" : "text-[#d4d4d4]"}>
          ★
        </span>
      ))}
    </p>
  )
}

export function ReviewPages({ reviews }: { reviews: ReviewCard[] }) {
  const frame = useRef<HTMLDivElement>(null)
  const drag = useRef({ id: -1, x: 0, y: 0, axis: null as null | "x" | "y" })
  const [perPage, setPerPage] = useState(5)
  const [page, setPage] = useState(0)
  const [dragPx, setDragPx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const signature = reviews.map((review) => review.key).join("|")
  const [seenKey, setSeenKey] = useState(signature)
  if (seenKey !== signature) {
    setSeenKey(signature)
    setPage(0)
    setDragPx(0)
    setDragging(false)
    drag.current = { id: -1, x: 0, y: 0, axis: null }
  }

  useLayoutEffect(() => {
    const el = frame.current
    if (!el) return
    const apply = () => {
      const next = cardsPerView(el.clientWidth)
      setPerPage((current) => (current === next ? current : next))
    }
    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const pages = chunk(reviews, perPage)
  const pageCount = pages.length
  const index = pageCount === 0 ? 0 : Math.min(page, pageCount - 1)
  const visible = pages[index]?.length ?? 0

  if (pageCount === 0) return null

  function go(next: number) {
    setPage(Math.max(0, Math.min(pageCount - 1, next)))
    setDragPx(0)
    setDragging(false)
    drag.current = { id: -1, x: 0, y: 0, axis: null }
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (pageCount < 2) return
    if (event.pointerType === "mouse" && event.button !== 0) return
    const target = event.target
    if (target instanceof Element && target.closest("button, a, input, textarea, select, label")) return
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, axis: null }
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerId !== drag.current.id) return
    const dx = event.clientX - drag.current.x
    const dy = event.clientY - drag.current.y
    if (!drag.current.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      drag.current.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y"
      if (drag.current.axis === "y") {
        drag.current.id = -1
        return
      }
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        // Capture is only available for an active pointer. Drag still follows the events.
      }
      setDragging(true)
    }
    if (drag.current.axis !== "x") return
    const atStart = index === 0 && dx > 0
    const atEnd = index === pageCount - 1 && dx < 0
    setDragPx(atStart || atEnd ? dx * 0.3 : dx)
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerId !== drag.current.id && !dragging) return
    const dx = event.clientX - drag.current.x
    const horizontal = drag.current.axis === "x"
    const width = frame.current?.clientWidth || 1
    drag.current = { id: -1, x: 0, y: 0, axis: null }
    setDragging(false)
    setDragPx(0)
    if (!horizontal) return
    const threshold = Math.min(56, width * 0.16)
    if (dx <= -threshold && index < pageCount - 1) setPage(index + 1)
    else if (dx >= threshold && index > 0) setPage(index - 1)
  }

  return (
    <div
      className="mt-8"
      data-review-list
      data-review-page={index + 1}
      data-review-pages={pageCount}
      data-review-per-page={perPage}
      data-review-visible={visible}
    >
      <div className="mb-3 flex items-center justify-end gap-2.5 text-[13px] leading-none text-[#7a7a7a] tabular-nums" data-review-pager>
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label="이전 후기"
          data-review-control="prev"
          className="px-1 text-base leading-none text-[#666666] disabled:opacity-30"
        >
          ‹
        </button>
        <span>
          {index + 1}/{pageCount}
        </span>
        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index === pageCount - 1}
          aria-label="다음 후기"
          data-review-control="next"
          className="px-1 text-base leading-none text-[#666666] disabled:opacity-30"
        >
          ›
        </button>
      </div>
      <div
        ref={frame}
        className="overflow-hidden"
        style={{ touchAction: "pan-y" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          className={cn(
            "flex w-full select-none",
            dragging ? "cursor-grabbing" : pageCount > 1 ? "cursor-grab" : undefined,
            !dragging && "transition-transform duration-300 ease-out motion-reduce:transition-none",
          )}
          style={{ transform: `translate3d(calc(${-index * 100}% + ${dragPx}px), 0, 0)` }}
        >
          {pages.map((group, pageIndex) => (
            <div
              key={group.map((review) => review.key).join("|") || pageIndex}
              className="grid w-full shrink-0 gap-3"
              style={{ gridTemplateColumns: `repeat(${perPage}, minmax(0, 1fr))` }}
              data-review-page-panel={pageIndex + 1}
              data-current={pageIndex === index ? "true" : "false"}
              aria-hidden={pageIndex === index ? undefined : true}
            >
              {group.map((review) => (
                <article
                  key={review.key}
                  data-review={review.id}
                  data-review-source={review.source}
                  data-review-card
                  className="min-w-0"
                >
                  {review.image ? (
                    <img
                      src={review.image}
                      alt=""
                      draggable={false}
                      className="aspect-square w-full object-cover"
                      data-review-photo="image"
                    />
                  ) : (
                    <div className="aspect-square w-full border border-[#e5e5e5] bg-[#f6f6f6]" data-review-photo="empty" />
                  )}
                  <p className="mt-2 truncate text-[12px] leading-4 text-[#222222]">{oneLine(review.body)}</p>
                  <Stars score={review.score} />
                  <p className="mt-1.5 text-[11px] leading-4 text-[#8a8a8a]">{review.date}</p>
                  <p className="text-[11px] leading-4 text-[#555555]">{review.name}</p>
                </article>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
