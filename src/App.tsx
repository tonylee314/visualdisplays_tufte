import { useEffect, useMemo, useState } from "react"
import { FilterBar } from "@/components/Filters"
import { Heatmap, type Sel } from "@/components/Heatmap"
import { IncidentPanel } from "@/components/IncidentPanel"
import { TooltipProvider } from "@/components/ui/tooltip"
import { CLASS_ORDER, CLASS_SHORT, NBINS, OTHER, binLabel, incidents } from "@/lib/data"
import { inRange, inScope, readFilters, writeFilters, type Filters } from "@/lib/filters"

const PHRASE: Record<string, string> = { "Safety/guardrail failure": "safety", "Security exploit": "security", "Data exposure": "data-exposure" }
const join = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`)
const top = (xs: string[]) => {
  const m = new Map<string, number>()
  xs.forEach((x) => m.set(x, (m.get(x) ?? 0) + 1))
  return [...m.entries()].sort((a, b) => b[1] - a[1])[0]
}

/** The hero is derived from the current filters: class selection, vendor selection and period all change it. */
function heroFor(filters: Filters, shown: typeof incidents) {
  const n = shown.length
  if (n === 0) return { title: "No incidents match these filters", dek: "Widen the period or turn a class or vendor back on.", stats: [] as [number, string][] }

  const visible = CLASS_ORDER.filter((c) => !filters.hiddenClasses.includes(c))
  const kind = visible.length === CLASS_ORDER.length ? "agentic AI" : join(visible.map((c) => PHRASE[c]!))
  const [lo, hi] = filters.range
  const when = lo === 0 && hi === NBINS - 1 ? `${2021}–${2021 + Math.floor((NBINS - 1) / 2)}` : lo === hi ? binLabel(lo) : `${binLabel(lo)} – ${binLabel(hi)}`
  const title = `${n} ${kind} ${n === 1 ? "incident" : "incidents"}, ${when}`

  const [cat, catN] = top(shown.map((d) => d.cat))!
  const named = shown.filter((d) => d.vendor !== OTHER)
  const vend = named.length ? top(named.map((d) => d.vendor)) : undefined
  const [bin, binN] = top(shown.map((d) => String(d.bin)))!
  const parts = [`Most common: ${cat} (${catN}).`]
  if (vend) parts.push(`Most affected vendor: ${vend[0]} (${vend[1]}).`)
  if (lo !== hi) parts.push(`Busiest half-year: ${binLabel(+bin)} (${binN}).`)

  const stats = visible.map((c) => [shown.filter((d) => d.cls === c).length, CLASS_SHORT[c]!.toLowerCase()] as [number, string])
  return { title, dek: parts.join(" "), stats }
}

export default function App() {
  const [filters, setFilters] = useState<Filters>(() => readFilters(location.search))
  const [sel, setSel] = useState<Sel>({})
  useEffect(() => writeFilters(filters), [filters])

  const shown = useMemo(() => incidents.filter((d) => inScope(d, filters) && inRange(d, filters)), [filters])
  const panelItems = useMemo(
    () => shown.filter((d) => (!sel.cat || d.cat === sel.cat) && (!sel.vendor || d.vendor === sel.vendor)),
    [shown, sel],
  )
  const hero = useMemo(() => heroFor(filters, shown), [filters, shown])

  return (
    <TooltipProvider>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <header className="mb-8 max-w-2xl">
          <p className="mb-1 text-xs font-medium tracking-wide text-[var(--heat-hi)] uppercase">Agentic AI incidents</p>
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{hero.title}</h1>
          <p className="mt-2 min-h-12 text-muted-foreground text-pretty">{hero.dek}</p>
          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {hero.stats.map(([v, l]) => (
              <div key={l}><dt className="sr-only">{l}</dt><dd><span className="text-lg font-semibold tabular-nums">{v}</span> <span className="text-muted-foreground">{l}</span></dd></div>
            ))}
          </dl>
        </header>

        <FilterBar filters={filters} onChange={(f) => { setFilters(f); setSel({}) }} />

        <section className="mt-8" aria-label="Incidents by category and vendor">
          <p className="mb-2 text-xs text-muted-foreground md:hidden">Scroll sideways to see every column →</p>
          <Heatmap filters={filters} sel={sel} onSelect={setSel} />
        </section>
      </main>
      <IncidentPanel sel={sel} items={panelItems} onClose={() => setSel({})} />
    </TooltipProvider>
  )
}
