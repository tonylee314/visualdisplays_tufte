import { useEffect, useMemo, useState } from "react"
import { FilterBar } from "@/components/Filters"
import { Heatmap, type Sel } from "@/components/Heatmap"
import { IncidentPanel } from "@/components/IncidentPanel"
import { TooltipProvider } from "@/components/ui/tooltip"
import { CLASS_ORDER, NBINS, incidents } from "@/lib/data"
import { inRange, inScope, readFilters, writeFilters, type Filters } from "@/lib/filters"

export default function App() {
  const [filters, setFilters] = useState<Filters>(() => readFilters(location.search))
  const [sel, setSel] = useState<Sel>({})
  useEffect(() => writeFilters(filters), [filters])

  const shown = useMemo(() => incidents.filter((d) => inScope(d, filters) && inRange(d, filters)), [filters])
  const panelItems = useMemo(
    () => shown.filter((d) => (!sel.cat || d.cat === sel.cat) && (!sel.vendor || d.vendor === sel.vendor)),
    [shown, sel],
  )
  // stats come from the data, not from copy
  const years = `${2021}–${2021 + Math.floor((NBINS - 1) / 2)}`

  return (
    <TooltipProvider>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <header className="mb-8 max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">Where agentic AI goes wrong</h1>
          <p className="mt-2 text-muted-foreground text-pretty">
            Logged incidents by failure category and vendor family. Each cell counts incidents; the bars on the right show the same
            category over time, on one shared scale.
          </p>
          <dl className="mt-4 flex gap-6 text-sm">
            {[[shown.length, shown.length === incidents.length ? "incidents" : `of ${incidents.length} incidents`], [years, "period"], [CLASS_ORDER.length, "classes"]].map(([v, l]) => (
              <div key={String(l)}><dt className="sr-only">{l}</dt><dd><span className="text-lg font-semibold tabular-nums">{v}</span> <span className="text-muted-foreground">{l}</span></dd></div>
            ))}
          </dl>
        </header>

        <FilterBar filters={filters} onChange={(f) => { setFilters(f); setSel({}) }} />

        <section className="mt-8" aria-label="Incidents by category and vendor">
          <p className="mb-2 text-xs text-muted-foreground md:hidden">Scroll sideways to see every column →</p>
          <Heatmap filters={filters} sel={sel} onSelect={setSel} />
        </section>

        <footer className="mt-10 max-w-2xl space-y-3 text-sm text-muted-foreground">
          <p><strong className="font-medium text-foreground">Reading it.</strong> Darker cell means more incidents. Colour carries one thing only, the count; classes are separated by space and labels, not hue. In the time bars, gray is the whole row and the dark overlay is the part you point at; faded bars fall outside the chosen period.</p>
          <p><strong className="font-medium text-foreground">Caveats.</strong> Vendor families are grouped by hand from the dataset's “Affected agentic AI” column, which also contains people and organisations harmed by AI output; those fall under “Other / non-vendor”. Counts are logged incidents, not rates.</p>
        </footer>
      </main>
      <IncidentPanel sel={sel} items={panelItems} onClose={() => setSel({})} />
    </TooltipProvider>
  )
}
