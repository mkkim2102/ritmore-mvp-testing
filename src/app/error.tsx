"use client"

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center gap-3 px-4">
      <h1 className="font-serif text-4xl">화면을 열지 못했습니다</h1>
      <p className="text-muted-foreground">기록을 읽는 중 문제가 생겼습니다. 다시 시도해 주세요.</p>
      <button
        type="button"
        onClick={reset}
        className="h-11 w-fit rounded-lg bg-primary px-4 text-sm text-primary-foreground"
      >
        다시 시도
      </button>
    </div>
  )
}
