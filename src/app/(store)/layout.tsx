import type { ReactNode } from "react"
import { DwellTracker } from "@/components/store/dwell-tracker"
import { StoreFooter } from "@/components/store/footer"
import { StoreHeader } from "@/components/store/header"
import { getRequestContext } from "@/lib/request"
import { recordPageVisit } from "@/lib/track"

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const context = await getRequestContext()
  recordPageVisit({
    path: context.path,
    visitorId: context.visitorId,
    sessionId: context.sessionId,
    preview: context.preview,
    prefetch: context.prefetch,
    document: context.document,
    returned: context.returned,
    touch: context.touch,
  })

  return (
    <>
      <DwellTracker />
      {context.preview ? (
        <p className="bg-accent px-4 py-2 text-center text-sm">
          미리보기 방문입니다. 기본 집계에는 넣지 않습니다.
        </p>
      ) : null}
      <StoreHeader />
      <main className="w-full flex-1">{children}</main>
      <StoreFooter />
    </>
  )
}
