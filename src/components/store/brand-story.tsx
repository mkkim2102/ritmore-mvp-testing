"use client"

import { useSyncExternalStore, type ReactNode } from "react"
import { SceneDeck } from "@/components/store/scene-deck"
import { cn } from "@/lib/utils"

const INK = "#111111"
const WHITE = "#FFFFFF"
const NAVY = "#17364A"
/** 닫는 장면의 옅은 파랑. */
const ICE = "#F5F9FC"
const LIME = "#DDF2B4"
/** 사진 가장자리와 가까운 따뜻한 회색. 비율이 안 맞을 때 여백에 쓴다. */
const PHOTO_MAT = "#E4E0DA"

const PHONE_QUERY = "(max-width: 1023px)"

function subscribePhone(onStoreChange: () => void) {
  const media = window.matchMedia(PHONE_QUERY)
  media.addEventListener("change", onStoreChange)
  return () => media.removeEventListener("change", onStoreChange)
}

function phoneSnapshot() {
  return window.matchMedia(PHONE_QUERY).matches
}

function usePhoneBrand() {
  return useSyncExternalStore(subscribePhone, phoneSnapshot, () => false)
}

type SceneProps = {
  "data-scene-background": string
}

function inkFor(background: string) {
  return background.toUpperCase() === NAVY ? "#FFFFFF" : INK
}

function Wordmark({ className }: { className?: string }) {
  return (
    <img
      src="/brand/ritmore.svg"
      alt="ritmore"
      draggable={false}
      className={cn("inline-block w-auto select-none", className)}
    />
  )
}

function Line({
  color,
  strong = false,
  className,
  children,
}: {
  color: string
  strong?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <p className={cn("font-normal leading-[1.65]", strong && "font-bold", className)} style={{ color }}>
      {children}
    </p>
  )
}

const copySize = "text-[1.05rem] sm:text-[1.28rem] lg:text-[1.5rem]"

function Frame({
  scene,
  align = "center",
  children,
  ...props
}: SceneProps & {
  scene: string
  align?: "center" | "start"
  children: ReactNode
}) {
  const background = props["data-scene-background"]
  const ink = inkFor(background)
  return (
    <section
      {...props}
      data-brand-scene={scene}
      className={cn(
        "absolute inset-0 flex min-h-0 overflow-hidden px-5 pt-16 pb-6 sm:px-8",
        align === "center" ? "items-center justify-center text-center" : "items-center text-left",
      )}
      style={{ backgroundColor: background, color: ink }}
    >
      <div className={cn("w-full", align === "center" ? "max-w-5xl" : "max-w-2xl")}>{children}</div>
    </section>
  )
}

function Opening(props: SceneProps) {
  return (
    <Frame {...props} scene="opening">
      <div className="flex flex-col items-center">
        <Wordmark className="h-8 sm:h-10" />
        <h1
          className="mt-8 text-[1.15rem] leading-snug font-normal sm:mt-10 sm:text-[1.45rem] lg:text-[1.85rem]"
          style={{ color: INK }}
        >
          내 리듬에 맞게, 나의 페이스대로.
        </h1>
        <p
          className="mt-3 text-[1.15rem] leading-snug sm:text-[1.45rem] lg:text-[1.85rem]"
          style={{ color: INK }}
        >
          your rhythm, your pace.
        </p>
      </div>
    </Frame>
  )
}

function OriginNight(props: SceneProps) {
  const whiteInk = inkFor(WHITE)
  const navyInk = inkFor(NAVY)
  return (
    <section
      {...props}
      data-brand-scene="origin-night"
      className="absolute inset-0 flex min-h-0 flex-col overflow-hidden"
    >
      <div
        data-brand-band="origin"
        className="flex h-[43%] shrink-0 items-center justify-center px-5 text-center sm:px-8"
        style={{ backgroundColor: WHITE, color: whiteInk }}
      >
        <p className={cn(copySize, "w-full max-w-5xl leading-[1.7]")} style={{ color: whiteInk }}>
          <Wordmark className="mr-[0.3em] inline-block h-[1.28em] w-auto translate-y-[0.06em]" />
          는
          <br />
          다섯 명의 고려대 학생으로부터 시작되었습니다.
        </p>
      </div>
      <div
        data-brand-band="night"
        className="flex min-h-0 flex-1 items-start justify-center overflow-hidden px-5 pt-6 pb-3 text-center sm:px-8 sm:pt-8 sm:pb-5 lg:pt-10 lg:pb-6"
        style={{ backgroundColor: NAVY, color: navyInk }}
      >
        <div className={cn(copySize, "w-full max-w-5xl space-y-3.5 sm:space-y-7 lg:space-y-8")}>
          <div>
            <Line color={navyInk} className="leading-[1.45] sm:leading-[1.65]">
              학회 발표를 준비하며 밤늦게까지 함께하던 다섯 명.
            </Line>
            <Line color={navyInk} className="leading-[1.45] sm:leading-[1.65]">
              끝내야 할 일은 남아 있었고,
            </Line>
            <Line color={navyInk} className="leading-[1.45] sm:leading-[1.65]">
              우리는 항상 커피나 에너지 드링크와 함께 했습니다.
            </Line>
          </div>
          <Line color={navyInk} className="leading-[1.45] sm:leading-[1.65]">
            하지만 <span className="underline decoration-2 underline-offset-[0.22em]">필요한 만큼만</span>{" "}
            카페인을 섭취하기는 어려웠습니다.
          </Line>
          <div>
            <Line color={navyInk} className="leading-[1.45] sm:leading-[1.65]">
              카페인을 너무 많이 먹어 가슴이 두근거렸고,
            </Line>
            <Line color={navyInk} className="leading-[1.45] sm:leading-[1.65]">
              음료를 마셔 화장실에 가느라 자리를 자주 비웠고,
            </Line>
            <Line color={navyInk} className="leading-[1.45] sm:leading-[1.65]">
              일을 마치고 집에 돌아가도 쉽게 잠들지 못했습니다.
            </Line>
          </div>
        </div>
      </div>
    </section>
  )
}

function Amount(props: SceneProps) {
  const color = inkFor(props["data-scene-background"])
  return (
    <Frame {...props} scene="amount">
      <div className={copySize}>
        <Line color={color}>조금 더 집중하고 싶은데,</Line>
        <Line color={color}>카페인을 더 섭취하기는 망설여졌습니다.</Line>
        <Line color={color}>우리에게 필요했던 건</Line>
        <Line color={color} strong>
          지금 나에게 맞춰 선택할 수 있는 양이었습니다.
        </Line>
      </div>
    </Frame>
  )
}

function CaffeinePhoto({ className }: { className?: string }) {
  return (
    <img
      src="/brand/caffeine-in-a-mint.png"
      alt="아이스 커피와 노트 옆에서 ritmore 틴을 들고 있는 손. caffeine, in a mint."
      width={654}
      height={819}
      draggable={false}
      className={cn("object-contain", className)}
    />
  )
}

function LimeCopy() {
  return (
    <div className="w-full max-w-xl space-y-6 text-left text-[1.05rem] leading-[1.65] sm:space-y-7 sm:text-[1.15rem] lg:text-[1.3rem] xl:text-[1.45rem]">
      <div>
        <Line color={INK}>그래서 우리가 주목한 것은</Line>
        <Line color={INK}>‘조절’이었습니다.</Line>
      </div>
      <div>
        <Line color={INK}>더 작은 단위로,</Line>
        <Line color={INK}>나의 기준에 맞춰.</Line>
      </div>
      <div>
        <Line color={INK}>섭취하는 카페인의 양을 확인하고,</Line>
        <Line color={INK} strong>
          필요에 따라 선택할 수 있는 카페인 민트 캔디.
        </Line>
      </div>
    </div>
  )
}

function RegulateSplit(props: SceneProps) {
  return (
    <section
      {...props}
      data-brand-scene="regulate"
      className="absolute inset-0 flex min-h-0 overflow-hidden"
      style={{ backgroundColor: LIME, color: INK }}
    >
      <div
        data-brand-photo="desk"
        className="h-full max-w-[48%] min-w-0 shrink-0 self-stretch"
        style={{ aspectRatio: "654 / 819", backgroundColor: PHOTO_MAT }}
      >
        <CaffeinePhoto className="h-full w-full" />
      </div>
      <div data-brand-band="lime" className="flex min-w-0 flex-1 items-center px-6 py-16 sm:px-10 lg:px-14">
        <LimeCopy />
      </div>
    </section>
  )
}

function RegulatePhoto(props: SceneProps) {
  return (
    <section
      {...props}
      data-brand-scene="photo"
      className="absolute inset-0 overflow-hidden"
      style={{ backgroundColor: PHOTO_MAT }}
    >
      <CaffeinePhoto className="h-full w-full object-contain object-center" />
    </section>
  )
}

function RegulateCopy(props: SceneProps) {
  return (
    <Frame {...props} scene="lime" align="start">
      <LimeCopy />
    </Frame>
  )
}

function Propose(props: SceneProps) {
  const color = inkFor(props["data-scene-background"])
  return (
    <Frame {...props} scene="propose">
      <div className={copySize}>
        <p className="leading-[1.7]" style={{ color }}>
          <Wordmark className="mr-[0.3em] inline-block h-[1.28em] w-auto translate-y-[0.06em]" />
          는
          <br />
          카페인을 고르는 새로운 방식을 제안합니다.
        </p>
        <div className="mt-8 sm:mt-10">
          <Line color={color}>커피나 에너지드링크를 마신 이후에도,</Line>
          <Line color={color}>카페인이 조금 더 필요하다고 느낄 때,</Line>
          <Line color={color}>얼마나 섭취할지 스스로 선택할 수 있도록.</Line>
        </div>
      </div>
    </Frame>
  )
}

function Close(props: SceneProps) {
  return (
    <Frame {...props} scene="close">
      <div className="flex flex-col items-center">
        <p
          className="text-[1.15rem] leading-snug sm:text-[1.45rem] lg:text-[1.85rem]"
          style={{ color: INK }}
        >
          your rhythm, your pace.
        </p>
        <Wordmark className="mt-6 h-8 sm:mt-8 sm:h-10" />
      </div>
    </Frame>
  )
}

export function BrandStory() {
  const phone = usePhoneBrand()

  /*
   * 2는 1과 같은 흰 배경이 장면의 위 43%를 차지하고, 그 안에 시작 문장이 있다.
   * 남색 밤 이야기는 그 아래, 같은 장면에 붙는다.
   * 4는 새 사진과 라임 조절 문장만이다. 넓은 화면에서는 한 화면을 좌우로 나눈다.
   * 핸드폰(1024px 미만)에서는 그 장면만 사진 전체 너비, 이어서 라임 글 페이지로 나뉜다.
   * 그 다음 장은 흰 배경의 새로운 방식 문장이고, 아이스 닫는 장이 마지막이다.
   */
  return (
    <SceneDeck>
      <Opening data-scene-background={WHITE} />
      <OriginNight data-scene-background={WHITE} />
      <Amount data-scene-background={WHITE} />
      {phone ? <RegulatePhoto data-scene-background={PHOTO_MAT} /> : null}
      {phone ? (
        <RegulateCopy data-scene-background={LIME} />
      ) : (
        <RegulateSplit data-scene-background={LIME} />
      )}
      <Propose data-scene-background={WHITE} />
      <Close data-scene-background={ICE} />
    </SceneDeck>
  )
}
