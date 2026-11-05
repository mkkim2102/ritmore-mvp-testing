"use client"

import { useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { TIN_DETAIL_ORBIT, TinModel } from "@/components/store/tin-model"
import type { DetailSlide } from "@/lib/product-slides"
import { cn } from "@/lib/utils"

const SWIPE_PX = 40

function isModelTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest("model-viewer, [data-tin-stage]"))
}

export function ProductGallery({
  slides,
  name,
  aspectClass = "aspect-square",
  className,
}: {
  slides: DetailSlide[]
  name: string
  aspectClass?: string
  className?: string
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const indexRef = useRef(0)
  const gesture = useRef<{
    id: number
    x: number
    y: number
    t: number
    locked: "x" | null
    model: boolean
  } | null>(null)
  const [index, setIndex] = useState(0)
  const count = Math.max(slides.length, 1)

  function apply(nextIndex: number, dragPx: number, animate: boolean) {
    const track = trackRef.current
    if (!track) return
    track.style.transition = animate ? "transform 280ms ease" : "none"
    const portion = count > 0 ? nextIndex / count : 0
    track.style.transform = `translate3d(calc(${-portion * 100}% + ${dragPx}px), 0, 0)`
  }

  function commit(nextIndex: number) {
    const clamped = Math.max(0, Math.min(count - 1, nextIndex))
    indexRef.current = clamped
    setIndex(clamped)
    apply(clamped, 0, true)
  }

  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return
    const portion = count > 0 ? indexRef.current / count : 0
    track.style.transition = "none"
    track.style.transform = `translate3d(calc(${-portion * 100}% + 0px), 0, 0)`
  }, [count])

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return
    const onModel = isModelTarget(event.target)
    // 모델 위 드래그는 model-viewer 카메라가 가져간다. 여기서 포인터를 잡으면 회전이 끊긴다.
    gesture.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      t: performance.now(),
      locked: null,
      model: onModel,
    }
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const current = gesture.current
    if (!current || current.id !== event.pointerId || current.model) return
    const dx = event.clientX - current.x
    const dy = event.clientY - current.y
    if (!current.locked) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      if (Math.abs(dy) >= Math.abs(dx)) {
        gesture.current = null
        return
      }
      current.locked = "x"
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    apply(indexRef.current, dx, false)
  }

  function finish(event: ReactPointerEvent<HTMLDivElement>) {
    const current = gesture.current
    if (!current || current.id !== event.pointerId) return
    const dx = event.clientX - current.x
    const dy = event.clientY - current.y
    const model = current.model
    const locked = current.locked
    gesture.current = null
    if (model) {
      const width = event.currentTarget.clientWidth
      const dt = performance.now() - current.t
      const distance = Math.abs(dx)
      const clearFlick =
        distance >= Math.max(88, width * 0.28) &&
        distance > Math.abs(dy) * 2 &&
        dt > 0 &&
        dt <= 420 &&
        distance / dt >= 0.42
      if (clearFlick) commit(indexRef.current + (dx < 0 ? 1 : -1))
      return
    }
    if (locked !== "x") {
      apply(indexRef.current, 0, true)
      return
    }
    if (dx <= -SWIPE_PX) commit(indexRef.current + 1)
    else if (dx >= SWIPE_PX) commit(indexRef.current - 1)
    else apply(indexRef.current, 0, true)
  }

  function onPointerCancel(event: ReactPointerEvent<HTMLDivElement>) {
    const current = gesture.current
    if (!current || current.id !== event.pointerId) return
    gesture.current = null
    apply(indexRef.current, 0, true)
  }

  return (
    <div
      data-product-gallery
      data-gallery-index={index + 1}
      data-gallery-count={slides.length}
      className={cn("relative overflow-hidden bg-white", aspectClass, className)}
    >
      <style>{`
        [data-product-gallery] model-viewer{
          display:block;
          width:100%;
          height:100%;
          touch-action:pan-y !important;
        }
        [data-product-gallery] model-viewer::part(default-progress-bar){display:none}
      `}</style>
      <div
        className="absolute inset-0 select-none"
        style={{ touchAction: "pan-y" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finish}
        onPointerCancel={onPointerCancel}
      >
        <div ref={trackRef} className="flex h-full" style={{ width: `${count * 100}%` }}>
          {slides.map((slide) => (
            <div key={slide.id} data-gallery-slide={slide.id} className="h-full min-w-0" style={{ width: `${100 / count}%` }}>
              {slide.kind === "model" ? (
                <TinModel
                  interactive
                  disableZoom
                  hint={false}
                  orbit={TIN_DETAIL_ORBIT}
                  label={`${name}. 페퍼민트 12개입 슬라이드 틴`}
                />
              ) : (
                <img
                  src={slide.src}
                  alt={slide.alt}
                  draggable={false}
                  className={cn(
                    "h-full w-full bg-white",
                    slide.fit === "cover" ? "object-cover" : "object-contain",
                    slide.fit === "cover" && !slide.position && "object-center",
                  )}
                  style={slide.position ? { objectPosition: slide.position } : undefined}
                />
              )}
            </div>
          ))}
        </div>
        {slides[index]?.kind === "model" && slides.length > 1 ? (
          <>
            <div
              data-gallery-swipe="prev"
              aria-hidden
              className="absolute inset-y-0 left-0 z-10 w-11"
              style={{ touchAction: "pan-y" }}
            />
            <div
              data-gallery-swipe="next"
              aria-hidden
              className="absolute inset-y-0 right-0 z-10 w-11"
              style={{ touchAction: "pan-y" }}
            />
          </>
        ) : null}
      </div>
      {slides.length > 1 ? (
        <p
          data-gallery-indicator
          className="pointer-events-none absolute right-3 bottom-3 rounded-full border border-[#e5e5e5] bg-white px-2.5 py-1 text-xs text-[#111111] tabular-nums"
        >
          {index + 1}/{slides.length}
        </p>
      ) : null}
      {slides.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="이전 사진"
            data-gallery-prev
            disabled={index <= 0}
            onClick={() => commit(indexRef.current - 1)}
            className="absolute top-1/2 left-3 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#e5e5e5] bg-white text-xl text-[#111111] disabled:opacity-30 lg:flex"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="다음 사진"
            data-gallery-next
            disabled={index >= slides.length - 1}
            onClick={() => commit(indexRef.current + 1)}
            className="absolute top-1/2 right-3 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#e5e5e5] bg-white text-xl text-[#111111] disabled:opacity-30 lg:flex"
          >
            ›
          </button>
        </>
      ) : null}
      {slides.length > 1 ? (
        <div data-gallery-dots className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1">
          {slides.map((slide, dotIndex) => (
            <button
              key={slide.id}
              type="button"
              data-gallery-dot={dotIndex + 1}
              aria-label={slide.kind === "model" ? "3D 틴" : `${dotIndex + 1}번 사진`}
              aria-current={dotIndex === index ? "true" : undefined}
              onClick={() => commit(dotIndex)}
              className="flex h-6 w-6 items-center justify-center"
            >
              <span
                className={cn(
                  "h-1.5 rounded-full border border-[#e5e5e5] bg-white",
                  dotIndex === index ? "w-4 border-[#111111] bg-[#111111]" : "w-1.5",
                )}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
