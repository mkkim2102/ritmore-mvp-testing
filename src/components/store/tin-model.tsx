"use client"

import { createElement, useEffect, useRef, type CSSProperties } from "react"

type TinViewer = HTMLElement & {
  jumpCameraToGoal?: () => void
}

/** 상세 첫 화면. 뚜껑이 프레임을 채우고, 평면에서 돌아가 모서리가 위에 오며 옆면 띠 대신 얇은 테만 보인다. */
export const TIN_DETAIL_ORBIT = "15deg 16deg auto"
const TIN_DETAIL_POSTER = "/products/ritmore-tin-poster.png"

export function TinModel({
  interactive = false,
  orbit = TIN_DETAIL_ORBIT,
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
  const viewerRef = useRef<TinViewer | null>(null)

  useEffect(() => {
    void import("@google/model-viewer")
  }, [])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    // 슬라이드가 보일 때 기본 궤도에서 돌아 들어오지 않게, 목표 각도로 바로 맞춘다.
    const jump = () => viewer.jumpCameraToGoal?.()
    viewer.addEventListener("load", jump)
    jump()
    return () => viewer.removeEventListener("load", jump)
  }, [orbit, fieldOfView, target])

  return (
    <div data-tin-stage className="relative h-full w-full bg-white">
      {createElement("model-viewer", {
        ref: viewerRef,
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
        ...(orbit === TIN_DETAIL_ORBIT ? { poster: TIN_DETAIL_POSTER } : {}),
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
