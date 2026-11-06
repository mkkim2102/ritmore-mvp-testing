"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function EntryUrlField({
  origin,
  targets,
  defaultPath,
}: {
  origin: string
  targets: { path: string; label: string }[]
  defaultPath: string
}) {
  const [path, setPath] = useState(defaultPath)

  return (
    <div className="space-y-2 md:col-span-2" data-entry-url-field>
      <Label htmlFor="entry-suffix">공개 주소</Label>
      <div className="flex flex-wrap gap-2">
        {targets.map((target) => (
          <Button
            key={target.path}
            type="button"
            size="sm"
            variant={path === target.path ? "default" : "outline"}
            onClick={() => setPath(target.path)}
            data-entry-target={target.path}
          >
            {target.label}
          </Button>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <span className="shrink-0 font-mono text-sm">{origin}</span>
        <Input
          id="entry-suffix"
          name="suffix"
          value={path}
          onChange={(event) => setPath(event.target.value)}
          className="h-9 font-mono"
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          required
          data-entry-suffix
        />
      </div>
      <p className="text-sm text-muted-foreground">
        복사하는 주소는 {origin} 과 이 경로입니다. 홈, 구성 상세, 구매를 고르거나 경로를 직접 고칩니다.
        /r/코드 로 적으면 그 경로만 나갑니다. 짧은 이름의 코드는 link 로만 붙고, 채널 이름은 주소에 넣지
        않습니다. 방문은 이 진입점과 인스타그램으로 기록됩니다.
      </p>
    </div>
  )
}
