"use client"

import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"

/**
 * 포장을 벗기는 장면.
 *
 * 연작 브랜드 스토리(yunjac.com/ko/brand/story)처럼 지금 장면이 위로 들리고,
 * 그 아래에 이미 깔려 있던 다음 장면이 드러난다. 다음 장면은 같이 올라오지 않는다.
 * 뒤로 가면 이전 장면이 위에서 내려와 현재 장면을 덮는다.
 *
 * 덱 위에서 휠을 굴리거나 손가락으로 끌면, 그 거리만큼 맨 위 시트가 바로 따라간다.
 * 조금 움직이면 조금 들리고, 장면 높이만큼 움직이면 시트가 완전히 빠진다.
 * 움직임이 끝난 뒤에만 가까운 장면으로 짧게 앉는다. 이전/다음은 한 장면씩 옮긴다.
 *
 * 휠과 스와이프는 덱 위에서만 기본 스크롤을 막는다. 자바스크립트가 없으면
 * 장면은 아래로 이어지는 문서가 되어 페이지가 스크롤된다.
 * 끄려면 SCENE_SLIDE_TEST 를 false 로 바꾼다. 장면이 data-scene-background 를 주면
 * 그 색을 쓰고, 없으면 SCENE_BACKGROUNDS 를 순서대로 쓴다. 문구는 각 페이지의 장면이다.
 */
export const SCENE_SLIDE_TEST = true

/** 손을 뗀 뒤 가까운 장면으로 붙는 시간. 따라가는 동안에는 쓰지 않는다. */
const SETTLE_MS = 240
/** 휠 사건이 이 만큼 끊기면 한 제스처가 끝난 것으로 본다. */
const WHEEL_END_MS = 320
/** 상품 이름, 가격, 틴 위의 손떨림. 이 안에서는 시트를 들지 않고 판매 페이지로 보낸다. */
const PRODUCT_PRESS_PX = 48

/** 장면마다 하나씩. 장면이 더 있으면 처음부터 다시 쓴다. */
const SCENE_BACKGROUNDS = ["#F5F9FC", "#BDE3FF", "#C1DCF0", "#DDF2B4", "#C7CDD3", "#17364A"] as const
const NAVY = "#17364A"

function sceneBackground(scene: ReactNode, sceneIndex: number) {
  if (isValidElement(scene)) {
    const declared = (scene.props as { "data-scene-background"?: unknown })["data-scene-background"]
    if (typeof declared === "string" && declared.startsWith("#")) return declared.toUpperCase()
  }
  return SCENE_BACKGROUNDS[sceneIndex % SCENE_BACKGROUNDS.length]
}

/** 0이면 장면이 제자리, 1이면 자기 높이만큼 위로 빠져 있다. */
function sheetLift(sceneIndex: number, position: number) {
  return Math.min(1, Math.max(0, position - sceneIndex))
}

function wheelPixels(event: WheelEvent, height: number) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 16
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * height
  return event.deltaY
}

function easeOut(t: number) {
  return 1 - (1 - t) ** 3
}

export function SceneDeck({
  children,
  reserveBuyBar = false,
}: {
  children: ReactNode
  /** 홈의 모바일 구매 막대만큼 아래를 비운다. 측정 전에 장면이 막대 아래로 들어가지 않게 한다. */
  reserveBuyBar?: boolean
}) {
  const scenes = Children.toArray(children).filter(Boolean)
  if (!SCENE_SLIDE_TEST) return <div className="bg-white">{scenes}</div>
  return (
    <SceneDeckOn count={scenes.length} reserveBuyBar={reserveBuyBar}>
      {scenes}
    </SceneDeckOn>
  )
}

function SceneDeckOn({
  children,
  count,
  reserveBuyBar,
}: {
  children: ReactNode[]
  count: number
  reserveBuyBar: boolean
}) {
  const router = useRouter()
  const deckRef = useRef<HTMLDivElement>(null)
  const panelRefs = useRef<Array<HTMLDivElement | null>>([])
  /** 장면 단위. 0은 첫 장면, 1은 첫 장면이 완전히 벗겨진 자리. */
  const offsetRef = useRef(0)
  const heightRef = useRef(0)
  const indexRef = useRef(0)
  const motionRef = useRef(0)
  const settleFrameRef = useRef<number | null>(null)
  const wheelTimerRef = useRef<number | null>(null)
  const gestureRef = useRef<"idle" | "wheel" | "touch" | "settle">("idle")
  const buttonLockRef = useRef(false)
  const draggedRef = useRef(false)
  const [index, setIndex] = useState(0)
  const [frame, setFrame] = useState<{ top: number; bottom: number } | null>(null)

  const maxIndex = Math.max(0, count - 1)

  const measure = useCallback(() => {
    const deck = deckRef.current
    if (!deck) return 0
    const height = deck.getBoundingClientRect().height
    if (height > 0) heightRef.current = height
    return heightRef.current
  }, [])

  const paint = useCallback(
    (next: number) => {
      const deck = deckRef.current
      if (!deck || !Number.isFinite(next)) return
      const height = heightRef.current || measure()
      if (height <= 0) return
      const position = Math.min(maxIndex, Math.max(0, next))
      offsetRef.current = position
      for (let sceneIndex = 0; sceneIndex < count; sceneIndex += 1) {
        const panel = panelRefs.current[sceneIndex]
        if (!panel) continue
        const lift = sheetLift(sceneIndex, position) * height
        panel.style.transform = `translate3d(0, ${-lift}px, 0)`
      }
      deck.dataset.sceneProgress = position.toFixed(4)
      deck.dataset.sceneGesture = gestureRef.current
      const shown = Math.min(maxIndex, Math.max(0, Math.round(position)))
      if (shown !== indexRef.current) {
        indexRef.current = shown
        setIndex(shown)
      }
    },
    [count, maxIndex, measure],
  )

  const cancelScheduled = useCallback(() => {
    if (settleFrameRef.current !== null) {
      window.cancelAnimationFrame(settleFrameRef.current)
      settleFrameRef.current = null
    }
    if (wheelTimerRef.current !== null) {
      window.clearTimeout(wheelTimerRef.current)
      wheelTimerRef.current = null
    }
  }, [])

  const animateTo = useCallback(
    (target: number) => {
      cancelScheduled()
      const motion = ++motionRef.current
      const dest = Math.min(maxIndex, Math.max(0, target))
      const start = offsetRef.current
      const finish = () => {
        if (motionRef.current !== motion) return
        gestureRef.current = "idle"
        buttonLockRef.current = false
        paint(dest)
      }
      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      if (Math.abs(dest - start) < 0.002 || reduced) {
        finish()
        return
      }
      gestureRef.current = "settle"
      const began = performance.now()
      const step = (now: number) => {
        if (motionRef.current !== motion) return
        const t = Math.min(1, (now - began) / SETTLE_MS)
        paint(start + (dest - start) * easeOut(t))
        if (t < 1) {
          settleFrameRef.current = window.requestAnimationFrame(step)
        } else {
          settleFrameRef.current = null
          finish()
        }
      }
      settleFrameRef.current = window.requestAnimationFrame(step)
    },
    [cancelScheduled, maxIndex, paint],
  )

  const settleNearest = useCallback(() => {
    const nearest = Math.min(maxIndex, Math.max(0, Math.round(offsetRef.current)))
    animateTo(nearest)
  }, [animateTo, maxIndex])

  const go = useCallback(
    (dir: number) => {
      if (buttonLockRef.current) return
      const raw = offsetRef.current
      const nearest = Math.round(raw)
      const position = Math.abs(raw - nearest) < 0.002 ? nearest : raw
      const from = dir > 0 ? Math.floor(position + 1e-6) : Math.ceil(position - 1e-6)
      const next = Math.min(maxIndex, Math.max(0, from + dir))
      if (next === from && Math.abs(position - from) < 0.002) return
      buttonLockRef.current = true
      animateTo(next)
    },
    [animateTo, maxIndex],
  )

  useLayoutEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtml = html.style.overflow
    const prevBody = body.style.overflow
    html.style.overflow = "hidden"
    body.style.overflow = "hidden"
    body.dataset.sceneLock = "on"
    return () => {
      html.style.overflow = prevHtml
      body.style.overflow = prevBody
      delete body.dataset.sceneLock
    }
  }, [])

  useLayoutEffect(() => {
    const measureFrame = () => {
      const header = document.querySelector<HTMLElement>("[data-store-header]")
      const bar = document.querySelector<HTMLElement>("[data-mobile-buy-bar]")
      const top = Math.max(0, Math.round(header?.getBoundingClientRect().bottom ?? 0))
      let bottom = 0
      if (bar) {
        const style = getComputedStyle(bar)
        const rect = bar.getBoundingClientRect()
        if (style.display !== "none" && style.visibility !== "hidden" && rect.height > 0) {
          bottom = Math.max(0, Math.round(window.innerHeight - rect.top))
        }
      }
      setFrame((current) =>
        current && current.top === top && current.bottom === bottom ? current : { top, bottom },
      )
    }

    measureFrame()
    const observer = new ResizeObserver(measureFrame)
    const header = document.querySelector("[data-store-header]")
    const bar = document.querySelector("[data-mobile-buy-bar]")
    if (header) observer.observe(header)
    if (bar) observer.observe(bar)
    const desktop = window.matchMedia("(min-width: 1024px)")
    desktop.addEventListener("change", measureFrame)
    window.addEventListener("resize", measureFrame)
    const frameId = window.requestAnimationFrame(measureFrame)
    return () => {
      observer.disconnect()
      desktop.removeEventListener("change", measureFrame)
      window.removeEventListener("resize", measureFrame)
      window.cancelAnimationFrame(frameId)
    }
  }, [])

  useLayoutEffect(() => {
    const deck = deckRef.current
    if (!deck) return
    const apply = () => {
      measure()
      paint(offsetRef.current)
    }
    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(deck)
    return () => observer.disconnect()
  }, [measure, paint, frame])

  useEffect(() => {
    const el = deckRef.current
    if (!el) return

    const onWheel = (event: WheelEvent) => {
      if (document.querySelector("[data-buy-sheet]")) return
      if (event.ctrlKey || event.metaKey) return
      if (gestureRef.current === "touch") return
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
      const height = heightRef.current || measure()
      if (height <= 0) return
      const dy = wheelPixels(event, height)
      if (dy === 0) return
      if (event.cancelable) event.preventDefault()
      buttonLockRef.current = false
      cancelScheduled()
      const motion = ++motionRef.current
      gestureRef.current = "wheel"
      paint(offsetRef.current + dy / height)
      wheelTimerRef.current = window.setTimeout(() => {
        wheelTimerRef.current = null
        if (motionRef.current !== motion) return
        if (gestureRef.current !== "wheel") return
        settleNearest()
      }, WHEEL_END_MS)
    }

    el.addEventListener("wheel", onWheel, { passive: false, capture: true })
    return () => el.removeEventListener("wheel", onWheel, { capture: true })
  }, [cancelScheduled, measure, paint, settleNearest])

  useEffect(() => {
    const el = deckRef.current
    if (!el) return
    let startX = 0
    let startY = 0
    let startOffset = 0
    let tracking = false
    let motion = 0
    let productPress = false
    let productHref: string | null = null
    let movedX = 0
    let movedY = 0

    const onStart = (event: TouchEvent) => {
      if (document.querySelector("[data-buy-sheet]")) {
        tracking = false
        return
      }
      if (event.touches.length !== 1) {
        tracking = false
        return
      }
      const target = event.target
      const ignore =
        target instanceof Element &&
        Boolean(target.closest("button, input, textarea, select"))
      if (ignore) {
        tracking = false
        return
      }
      const point = event.touches[0]
      const productLink = target instanceof Element ? target.closest("a[data-product-link]") : null
      tracking = true
      productHref = productLink?.getAttribute("href") ?? null
      productPress = Boolean(productHref)
      movedX = 0
      movedY = 0
      startX = point.clientX
      startY = point.clientY
      startOffset = offsetRef.current
      draggedRef.current = false
      buttonLockRef.current = false
      cancelScheduled()
      motion = ++motionRef.current
      gestureRef.current = "touch"
      measure()
      if (productPress && event.cancelable) event.preventDefault()
    }
    const onMove = (event: TouchEvent) => {
      if (!tracking || event.touches.length !== 1) return
      const point = event.touches[0]
      const dy = startY - point.clientY
      const dx = point.clientX - startX
      movedX = dx
      movedY = dy
      if (productPress && Math.hypot(dx, dy) < PRODUCT_PRESS_PX) return
      if (Math.abs(dy) <= Math.abs(dx)) return
      if (event.cancelable) event.preventDefault()
      if (Math.abs(dy) > 8) draggedRef.current = true
      const height = heightRef.current || measure()
      if (height <= 0) return
      gestureRef.current = "touch"
      paint(startOffset + dy / height)
    }
    const onEnd = () => {
      if (!tracking) return
      tracking = false
      if (motionRef.current !== motion) return
      if (gestureRef.current !== "touch") return
      const productTap = productPress && Math.hypot(movedX, movedY) < PRODUCT_PRESS_PX
      if (productTap) {
        draggedRef.current = false
        gestureRef.current = "idle"
        paint(startOffset)
        if (productHref) router.push(productHref)
        return
      }
      if (draggedRef.current) {
        window.setTimeout(() => {
          draggedRef.current = false
        }, 500)
      }
      settleNearest()
    }

    el.addEventListener("touchstart", onStart, { passive: false })
    el.addEventListener("touchmove", onMove, { passive: false })
    el.addEventListener("touchend", onEnd)
    el.addEventListener("touchcancel", onEnd)
    return () => {
      el.removeEventListener("touchstart", onStart)
      el.removeEventListener("touchmove", onMove)
      el.removeEventListener("touchend", onEnd)
      el.removeEventListener("touchcancel", onEnd)
    }
  }, [cancelScheduled, measure, paint, router, settleNearest])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (document.querySelector("[data-buy-sheet]")) return
      const tag = event.target instanceof HTMLElement ? event.target.tagName : ""
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return
      if (event.key === "ArrowDown" || event.key === "PageDown") {
        event.preventDefault()
        go(1)
      } else if (event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault()
        go(-1)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [go])

  useEffect(() => {
    return () => {
      motionRef.current += 1
      cancelScheduled()
    }
  }, [cancelScheduled])

  return (
    <div
      ref={deckRef}
      data-scene-deck="test"
      data-scene-motion="peel"
      data-scene-follow="gesture"
      data-scene-count={count}
      data-scene-armed="yes"
      data-reserve-buy-bar={reserveBuyBar ? "yes" : "no"}
      className={
        reserveBuyBar
          ? "fixed inset-x-0 z-10 overflow-hidden bg-white top-14 bottom-[6.25rem] md:top-16 lg:bottom-0"
          : "fixed inset-x-0 z-10 overflow-hidden bg-white top-14 bottom-0 md:top-16"
      }
      style={frame ? { top: frame.top, bottom: frame.bottom, touchAction: "none" } : { touchAction: "none" }}
      onClickCapture={(event) => {
        if (!draggedRef.current) return
        event.preventDefault()
        event.stopPropagation()
        draggedRef.current = false
      }}
    >
      <style>{`
        body[data-scene-lock="on"] footer{display:none}
        [data-home-main] model-viewer::part(default-progress-bar){display:none}
        [data-scene-panel]{
          transition: none;
          will-change: transform;
        }
        [data-scene-panel] [data-tin-stage],
        [data-scene-panel] [data-tin-stage] model-viewer{
          background-color:transparent !important;
          --poster-color:transparent;
        }
        [data-scene-tone="navy"] :is(h1, h2, h3, p):not([data-price-trio], [data-journey-step]){color:#ffffff}
      `}</style>
      <noscript>
        <style>{`
          [data-scene-deck="test"]{
            position:relative !important;
            inset:auto !important;
            top:auto !important;
            right:auto !important;
            bottom:auto !important;
            left:auto !important;
            height:auto !important;
            overflow:visible !important;
            touch-action:auto !important;
          }
          [data-scene-deck="test"] [data-scene-stage]{height:auto !important}
          [data-scene-deck="test"] [data-scene-panel]{
            position:relative !important;
            inset:auto !important;
            height:auto !important;
            min-height:calc(100svh - 3.5rem);
            transform:none !important;
          }
          [data-scene-deck="test"][data-reserve-buy-bar="yes"] [data-scene-panel]{
            min-height:calc(100svh - 3.5rem - 6.25rem);
          }
          @media (min-width: 768px){
            [data-scene-deck="test"] [data-scene-panel]{
              min-height:calc(100svh - 4rem);
            }
            [data-scene-deck="test"][data-reserve-buy-bar="yes"] [data-scene-panel]{
              min-height:calc(100svh - 4rem - 6.25rem);
            }
          }
          @media (min-width: 1024px){
            [data-scene-deck="test"] [data-scene-panel],
            [data-scene-deck="test"][data-reserve-buy-bar="yes"] [data-scene-panel]{
              min-height:calc(100svh - 4rem);
            }
          }
        `}</style>
      </noscript>
      <div data-scene-stage className="relative h-full">
        {children.map((scene, sceneIndex) => {
          const background = sceneBackground(scene, sceneIndex)
          const navy = background === NAVY
          const current = sceneIndex === index
          return (
            <div
              key={sceneIndex}
              ref={(node) => {
                panelRefs.current[sceneIndex] = node
              }}
              data-scene-panel={sceneIndex}
              data-scene-current={current ? "yes" : "no"}
              data-scene-layer={sceneIndex < index ? "above" : current ? "current" : "below"}
              data-scene-bg={background}
              data-scene-tone={navy ? "navy" : "light"}
              aria-hidden={current ? undefined : true}
              inert={current ? undefined : true}
              className="absolute inset-0"
              style={{
                zIndex: count - sceneIndex,
                backgroundColor: background,
                color: navy ? "#ffffff" : "#111111",
              }}
            >
              {scene}
            </div>
          )
        })}
      </div>
    </div>
  )
}
