import { CopyLink } from "@/components/dashboard/copy-link"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { channelLabel } from "@/lib/channels"
import { linkHref } from "@/lib/catalog"
import { cn } from "@/lib/utils"
import type { TrackingLink } from "@/lib/types"

export function TrialLinks({ origin, links }: { origin: string; links: TrackingLink[] }) {
  const active = links.filter((link) => !link.archived)
  if (active.length === 0) {
    return <p className="text-sm text-muted-foreground">아직 쓸 수 있는 링크가 없습니다.</p>
  }

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {active.map((link) => {
        const url = linkHref(origin, link)
        return (
          <Card key={link.id} size="sm">
            <CardHeader>
              <CardTitle>{link.name}</CardTitle>
              <CardDescription>
                {channelLabel(link.channel)} · {link.code}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs break-all text-muted-foreground">{url}</p>
              <div className="flex flex-wrap gap-2">
                <CopyLink url={url} />
                <a
                  href={linkHref(origin, link, true)}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                >
                  미리보기
                </a>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
