import type { ReactNode } from "react"
import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { LabNav } from "@/components/dashboard/lab-nav"
import { Button } from "@/components/ui/button"
import { logoutAction } from "@/lib/actions"
import { labTokenValid } from "@/lib/auth"
import { COOKIE } from "@/lib/touch"

export default async function LabLayout({ children }: { children: ReactNode }) {
  const jar = await cookies()
  if (!labTokenValid(jar.get(COOKIE.lab)?.value)) redirect("/dashboard/login")

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6">
      <header className="mb-6 flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">운영 화면</p>
            <p className="font-serif text-2xl">어느 링크가 어디까지 갔나</p>
          </div>
          <LabNav />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" render={<Link href="/" />}>
            스토어
          </Button>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost">
              나가기
            </Button>
          </form>
        </div>
      </header>
      {children}
    </div>
  )
}
