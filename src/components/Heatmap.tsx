import { useMemo, useState, type KeyboardEvent } from "react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  CATS, CELL_MAX, CLASS_LABEL, CLASS_ORDER, NBINS, SPARK_MAX, VENDOR_LIST, VENDOR_SHORT, binLabel, classOf, incidents, type Incident,
} from "@/lib/data"
import { inRange, inScope, type Filters } from "@/lib/filters"

export type Sel = { cat?: string; vendor?: string }

const SP_BIN = 18, SP_H = 26, SP_W = NBINS * SP_BIN
const COL_MAX = Math.max(...VENDOR_LIST.map((v) => incidents.filter((d) => d.vendor === v).length))
const ROW_MAX = Math.max(...CATS.map((c) => incidents.filter((d) => d.cat === c).length))
const key = (cat: string, vendor: string) => `${cat}|${vendor}`
const heat = (n: number) => Math.round(Math.sqrt(n / CELL_MAX) * 100)

function Spark({ bins, overlay, range }: { bins: number[]; overlay: number[] | null; range: [number, number] }) {
  const h = (n: number) => (n / SPARK_MAX) * (SP_H - 4)
  return (
    <svg width={SP_W} height={SP_H} viewBox={`0 0 ${SP_W} ${SP_H}`} aria-hidden className="shrink-0">
      <line x1={0} x2={SP_W} y1={SP_H - 1.5} y2={SP_H - 1.5} stroke="var(--border)" />
      {bins.map((n, b) => {
        const faint = b < range[0] || b > range[1] // layering: out-of-range context stays, but recedes
        return (
          <g key={b} opacity={faint ? 0.4 : 1}>
            {n > 0 && <rect x={b * SP_BIN + 1} width={SP_BIN - 2} y={SP_H - 2 - h(n)} height={h(n)} fill="var(--spark-all)" />}
            {overlay && overlay[b]! > 0 && <rect x={b * SP_BIN + 1} width={SP_BIN - 2} y={SP_H - 2 - h(overlay[b]!)} height={h(overlay[b]!)} fill="var(--spark-sel)" />}
          </g>
        )
      })}
    </svg>
  )
}

function CellTip({ cat, vendor, items, rowTotal }: { cat: string; vendor: string; items: Incident[]; rowTotal: number }) {
  const sorted = [...items].sort((a, b) => a.t - b.t)
  return (
    <div className="space-y-1">
      <div className="font-medium">{cat} <span className="text-muted-foreground">×</span> {vendor}</div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl leading-none font-semibold tabular-nums">{items.length}</span>
        <span className="text-muted-foreground">of {rowTotal} in this category</span>
      </div>
      <div className="text-muted-foreground">{sorted[0]!.label}{sorted.length > 1 && ` – ${sorted[sorted.length - 1]!.label}`}</div>
      <div className="text-[11px] text-muted-foreground">Click to list incidents</div>
    </div>
  )
}

export function Heatmap({ filters, sel, onSelect }: { filters: Filters; sel: Sel; onSelect: (s: Sel) => void }) {
  const [hover, setHover] = useState<Sel | null>(null)
  const [rove, setRove] = useState<[number, number] | null>(null)

  const vendors = VENDOR_LIST.filter((v) => !filters.hiddenVendors.includes(v))
  const groups = CLASS_ORDER.filter((k) => !filters.hiddenClasses.includes(k)).map((k) => ({ k, cats: CATS.filter((c) => classOf(c) === k) }))
  const flatCats = groups.flatMap((g) => g.cats)

  const { scoped, shown, cell, rowTot, colTot, bins } = useMemo(() => {
    const scoped = incidents.filter((d) => inScope(d, filters))
    const shown = scoped.filter((d) => inRange(d, filters))
    const cell = new Map<string, Incident[]>(), rowTot = new Map<string, number>(), colTot = new Map<string, number>()
    shown.forEach((d) => {
      const k = key(d.cat, d.vendor)
      cell.set(k, [...(cell.get(k) ?? []), d])
      rowTot.set(d.cat, (rowTot.get(d.cat) ?? 0) + 1)
      colTot.set(d.vendor, (colTot.get(d.vendor) ?? 0) + 1)
    })
    const bins = new Map<string, number[]>()
    scoped.forEach((d) => {
      const a = bins.get(d.cat) ?? Array<number>(NBINS).fill(0)
      a[d.bin]!++
      bins.set(d.cat, a)
    })
    return { scoped, shown, cell, rowTot, colTot, bins }
  }, [filters])

  const focus = hover ?? (sel.cat || sel.vendor ? sel : null)
  const overlayFor = (cat: string) => {
    if (!focus || (focus.cat && focus.cat !== cat)) return null
    const a = Array<number>(NBINS).fill(0)
    scoped.forEach((d) => { if (d.cat === cat && (!focus.vendor || d.vendor === focus.vendor)) a[d.bin]!++ })
    return a
  }

  if (shown.length === 0)
    return (
      <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        No incidents match these filters.
      </div>
    )

  const cols = `minmax(9.5rem,14.5rem) repeat(${vendors.length}, 4rem) 5.5rem ${SP_W + 8}px`
  const sparkCol = vendors.length + 3
  const secShown = shown.filter((d) => d.cls === "Security exploit")
  const secLate = secShown.filter((d) => d.t >= 2025 * 12).length

  // keyboard: arrow keys move between non-empty cells (roving tabindex)
  const empty = (r: number, c: number) => !cell.has(key(flatCats[r]!, vendors[c]!))
  const firstFilled: [number, number] = (() => {
    for (let r = 0; r < flatCats.length; r++) for (let c = 0; c < vendors.length; c++) if (!empty(r, c)) return [r, c]
    return [0, 0]
  })()
  const active = rove && !empty(rove[0], rove[1]) && rove[0] < flatCats.length && rove[1] < vendors.length ? rove : firstFilled
  const onKey = (e: KeyboardEvent, r: number, c: number) => {
    const d: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }
    const step = d[e.key]
    if (!step) return
    e.preventDefault()
    let nr = r + step[0], nc = c + step[1]
    while (nr >= 0 && nr < flatCats.length && nc >= 0 && nc < vendors.length) {
      if (!empty(nr, nc)) {
        document.querySelector<HTMLElement>(`[data-r="${nr}"][data-c="${nc}"]`)?.focus()
        return
      }
      nr += step[0]; nc += step[1]
    }
  }

  let rowIndex = -1
  return (
    <div className="relative -mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      <div className="min-w-max">
        {/* column headers */}
        <div className="grid items-end" style={{ gridTemplateColumns: cols }}>
          <div />
          {vendors.map((v) => {
            const [a, b] = VENDOR_SHORT[v] ?? [v]
            const on = sel.vendor === v && !sel.cat
            return (
              <button
                key={v}
                onClick={() => onSelect(on ? {} : { vendor: v })}
                aria-pressed={on}
                aria-label={`${v}: list incidents`}
                className={cn("mx-px min-h-11 rounded-sm px-0.5 pb-1 text-center text-xs leading-tight text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50", on && "font-semibold text-foreground")}
              >
                {a}{b && <><br />{b}</>}
              </button>
            )
          })}
          <div className="pb-1 pl-2 text-xs text-muted-foreground">Row total</div>
          <div className="pb-1 text-xs leading-tight text-muted-foreground">
            Incidents per half-year<br /><span className="text-[11px] opacity-80">same scale in every row</span>
          </div>
        </div>

        {groups.map(({ k, cats }) => {
          const n = shown.filter((d) => d.cls === k).length
          return (
            <section key={k} className="mt-5 first:mt-1" aria-label={CLASS_LABEL[k]}>
              <h3 className="mb-0.5 text-xs font-medium text-muted-foreground italic">{CLASS_LABEL[k]} · {n}</h3>
              {cats.map((cat) => {
                rowIndex++
                const r = rowIndex
                const dimRow = !!sel.cat && sel.cat !== cat
                const total = rowTot.get(cat) ?? 0
                return (
                  <div key={cat} className={cn("grid items-center transition-opacity duration-150", dimRow && "opacity-30")} style={{ gridTemplateColumns: cols }}>
                    <button
                      onClick={() => onSelect(sel.cat === cat && !sel.vendor ? {} : { cat })}
                      aria-pressed={sel.cat === cat && !sel.vendor}
                      className={cn("min-h-7 rounded-sm pr-3 text-right text-[13px] outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50", sel.cat === cat && !sel.vendor && "font-semibold")}
                    >
                      {cat}
                    </button>
                    {vendors.map((v, c) => {
                      const items = cell.get(key(cat, v))
                      if (!items) return <div key={v} className="h-7" aria-hidden />
                      const n = items.length, p = heat(n)
                      const selected = sel.cat === cat && sel.vendor === v
                      const dimCell = (sel.cat || sel.vendor) && !((!sel.cat || sel.cat === cat) && (!sel.vendor || sel.vendor === v))
                      const isActive = active[0] === r && active[1] === c
                      return (
                        <Tooltip key={v}>
                          <TooltipTrigger asChild>
                            <button
                              data-r={r} data-c={c}
                              tabIndex={isActive ? 0 : -1}
                              aria-label={`${cat}, ${v}: ${n} incident${n === 1 ? "" : "s"}`}
                              aria-pressed={selected}
                              onClick={() => { setRove([r, c]); onSelect(selected ? {} : { cat, vendor: v }) }}
                              onKeyDown={(e) => onKey(e, r, c)}
                              onFocus={() => { setRove([r, c]); setHover({ cat, vendor: v }) }}
                              onBlur={() => setHover(null)}
                              onPointerEnter={() => setHover({ cat, vendor: v })}
                              onPointerLeave={() => setHover(null)}
                              style={filters.mode === "shade" ? { backgroundColor: `color-mix(in oklab, var(--heat-hi) ${p}%, var(--heat-lo))`, color: p >= 58 ? "var(--heat-fg)" : undefined } : undefined}
                              className={cn(
                                "m-px flex h-7 items-center justify-center rounded-[3px] text-xs font-medium tabular-nums outline-none transition-opacity duration-150 focus-visible:ring-[3px] focus-visible:ring-ring",
                                filters.mode === "dots" && "hover:bg-accent",
                                selected && "ring-2 ring-foreground",
                                dimCell && "opacity-30",
                              )}
                            >
                              {filters.mode === "shade"
                                ? n >= 3 && n
                                : (
                                  <span className="flex max-w-[3.2rem] flex-wrap justify-center gap-[2px]" aria-hidden>
                                    {Array.from({ length: n }, (_, i) => <i key={i} className="size-[5px] rounded-full" style={{ background: "var(--heat-hi)" }} />)}
                                  </span>
                                )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top"><CellTip cat={cat} vendor={v} items={items} rowTotal={total} /></TooltipContent>
                        </Tooltip>
                      )
                    })}
                    <div className="flex items-center gap-1.5 pl-2" aria-label={`${total} total`}>
                      <i className="block h-2 rounded-[1px] bg-muted-foreground/60" style={{ width: `${(total / ROW_MAX) * 100 * 0.62}%`, minWidth: total ? 2 : 0 }} />
                      <span className="text-[11px] text-muted-foreground tabular-nums">{total}</span>
                    </div>
                    <div className="pl-1"><Spark bins={bins.get(cat) ?? Array(NBINS).fill(0)} overlay={overlayFor(cat)} range={filters.range} /></div>
                  </div>
                )
              })}
              {k === "Security exploit" && secShown.length > 0 && (
                <p className="mt-1 text-[11.5px] text-muted-foreground italic" style={{ marginLeft: "0", display: "grid", gridTemplateColumns: cols }}>
                  <span style={{ gridColumn: sparkCol }} className="pl-1">{secLate} of {secShown.length} security exploits<br />are dated 2025 or later</span>
                </p>
              )}
            </section>
          )
        })}

        {/* column totals + shared time axis */}
        <div className="mt-2 grid items-start" style={{ gridTemplateColumns: cols }}>
          <div className="pr-3 text-right text-[11px] text-muted-foreground">Column total</div>
          {vendors.map((v) => (
            <div key={v} className="flex flex-col items-center gap-0.5">
              <i className="block w-2.5 rounded-[1px] bg-muted-foreground/60" style={{ height: ((colTot.get(v) ?? 0) / COL_MAX) * 28 + 1 }} />
              <span className="text-[11px] text-muted-foreground tabular-nums">{colTot.get(v) ?? 0}</span>
            </div>
          ))}
          <div />
          <div className="pl-1">
            <svg width={SP_W + 14} height={20} viewBox={`-14 0 ${SP_W + 14} 20`} style={{ marginLeft: -14 }} aria-hidden>
              {Array.from({ length: Math.ceil(NBINS / 2) }, (_, i) => (
                <g key={i}>
                  <line x1={i * 2 * SP_BIN} x2={i * 2 * SP_BIN} y1={0} y2={4} stroke="var(--muted-foreground)" />
                  <text x={i * 2 * SP_BIN} y={16} textAnchor="middle" fontSize={11} fill="var(--muted-foreground)">{2021 + i}</text>
                </g>
              ))}
            </svg>
            <span className="sr-only">Time axis: {binLabel(0)} to {binLabel(NBINS - 1)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
