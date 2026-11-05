"use client"

import { createElement, useEffect, type CSSProperties } from "react"

export function TinModel({
  interactive = false,
  orbit = "32deg 62deg auto",
  fieldOfView = "25deg",
  target,
  label = "ritmore 페퍼민트 12개입 슬라이드 틴",
  disableZoom,
  hint,
}: {
  interactive?: boolean
  orbit?: string
  fieldOfView?: string
  /** model-viewer camera-target. 홈 히어로만 넘긴다. */
  target?: string
  label?: string
  /** 휠과 핀치 확대를 끈다. 상세에서는 페이지 스크롤을 남기기 위해 켠다. */
  disableZoom?: boolean
  hint?: boolean
}) {
  const zoomOff = disableZoom ?? !interactive
  const showHint = hint ?? interactive

  useEffect(() => {
    void import("@google/model-viewer")
  }, [])

  return (
    <div data-tin-stage className="relative h-full w-full bg-white">
      {createElement("model-viewer", {
        src: "/models/ritmore-tin.glb?v=3",
        alt: label,
        "camera-controls": interactive ? "" : undefined,
        "disable-zoom": zoomOff ? "" : undefined,
        "interaction-prompt": "none",
        "touch-action": "pan-y",
        "shadow-intensity": "0.65",
        "shadow-softness": "0.9",
        exposure: "1",
        "tone-mapping": "commerce",
        "environment-image": "neutral",
        "camera-orbit": orbit,
        "field-of-view": fieldOfView,
        ...(target ? { "camera-target": target } : {}),
        style: {
          width: "100%",
          height: "100%",
          backgroundColor: "#ffffff",
          pointerEvents: interactive ? "auto" : "none",
          "--poster-color": "#ffffff",
        } as CSSProperties,
      })}
      {showHint ? (
        <p className="pointer-events-none absolute bottom-2 left-0 right-0 text-center text-[11px] text-[#111111]/60">
          드래그해서 돌려 볼 수 있습니다.
        </p>
      ) : null}
    </div>
  )
}
