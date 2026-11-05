import type { StatsFilters } from "@/lib/stats"

const selectClass =
  "h-9 rounded-lg border border-input bg-card px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

export function Filters({
  filters,
  links,
  channels,
}: {
  filters: StatsFilters
  links: { code: string; name: string }[]
  channels: { id: string; label: string }[]
}) {
  return (
    <form method="get" className="flex flex-wrap items-end gap-3">
      <label className="space-y-1 text-sm">
        <span className="text-muted-foreground">기간 · 서울</span>
        <select name="range" defaultValue={filters.range} className={selectClass}>
          <option value="today">오늘</option>
          <option value="7d">최근 7일</option>
          <option value="30d">최근 30일</option>
          <option value="all">전체</option>
        </select>
      </label>
      <label className="space-y-1 text-sm">
        <span className="text-muted-foreground">링크</span>
        <select name="link" defaultValue={filters.link} className={selectClass}>
          <option value="">전체</option>
          {links.map((link) => (
            <option key={link.code} value={link.code}>
              {link.name}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-sm">
        <span className="text-muted-foreground">채널</span>
        <select name="channel" defaultValue={filters.channel} className={selectClass}>
          <option value="">전체</option>
          {channels.map((channel) => (
            <option key={channel.id} value={channel.id}>
              {channel.label}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-sm">
        <span className="text-muted-foreground">미리보기</span>
        <select name="preview" defaultValue={filters.includePreview ? "1" : "0"} className={selectClass}>
          <option value="0">집계에서 제외</option>
          <option value="1">포함</option>
        </select>
      </label>
      <button type="submit" className="h-9 rounded-lg bg-primary px-3 text-sm text-primary-foreground">
        적용
      </button>
    </form>
  )
}
