const fieldClass =
  "h-9 rounded-lg border border-input bg-card px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

const buttonClass = "h-9 rounded-lg bg-primary px-3 text-sm text-primary-foreground"

export function FunnelExport({ today }: { today: string }) {
  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-4" data-export="funnel">
      <div>
        <h3 className="font-serif text-lg">엑셀</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          실제 방문과 이벤트를 받습니다. 미리보기는 빠집니다. 날짜는 서울 기준이고, 기간은 시작일과 종료일을 모두 포함합니다.
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <form method="get" action="/dashboard/funnel/export">
          <input type="hidden" name="scope" value="all" />
          <button type="submit" className={buttonClass}>
            전체 받기
          </button>
        </form>
        <form method="get" action="/dashboard/funnel/export" className="flex items-center gap-2">
          <input type="hidden" name="scope" value="day" />
          <label className="text-sm text-muted-foreground" htmlFor="export-date">
            하루
          </label>
          <input id="export-date" type="date" name="date" defaultValue={today} required className={fieldClass} />
          <button type="submit" className={buttonClass}>
            이 날 받기
          </button>
        </form>
        <form method="get" action="/dashboard/funnel/export" className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="scope" value="range" />
          <label className="text-sm text-muted-foreground" htmlFor="export-from">
            기간
          </label>
          <input id="export-from" type="date" name="from" defaultValue={today} required aria-label="시작일" className={fieldClass} />
          <span className="text-sm text-muted-foreground">부터</span>
          <input type="date" name="to" defaultValue={today} required aria-label="종료일" className={fieldClass} />
          <span className="text-sm text-muted-foreground">까지</span>
          <button type="submit" className={buttonClass}>
            이 기간 받기
          </button>
        </form>
      </div>
    </section>
  )
}
