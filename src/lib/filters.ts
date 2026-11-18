import { CLASS_ORDER, NBINS, VENDOR_LIST, incidents, type Incident } from "./data"

export type Mode = "shade" | "dots"
export type Filters = { hiddenClasses: string[]; hiddenVendors: string[]; range: [number, number]; mode: Mode }

export const DEFAULT_FILTERS: Filters = { hiddenClasses: [], hiddenVendors: [], range: [0, NBINS - 1], mode: "shade" }

export const isFiltered = (f: Filters) =>
  f.hiddenClasses.length > 0 || f.hiddenVendors.length > 0 || f.range[0] !== 0 || f.range[1] !== NBINS - 1

/** Filter state lives in the URL so a view can be linked and survives refresh. */
export function readFilters(search: string): Filters {
  const p = new URLSearchParams(search)
  const hiddenClasses = p.getAll("hc").filter((c) => CLASS_ORDER.includes(c))
  const hiddenVendors = p.getAll("hv").filter((v) => VENDOR_LIST.includes(v))
  const m = /^(\d+)-(\d+)$/.exec(p.get("r") ?? "")
  const lo = m ? Math.min(+m[1]!, NBINS - 1) : 0
  const hi = m ? Math.min(Math.max(+m[2]!, lo), NBINS - 1) : NBINS - 1
  return { hiddenClasses, hiddenVendors, range: [lo, hi], mode: p.get("m") === "dots" ? "dots" : "shade" }
}

export function writeFilters(f: Filters) {
  const p = new URLSearchParams()
  f.hiddenClasses.forEach((c) => p.append("hc", c))
  f.hiddenVendors.forEach((v) => p.append("hv", v))
  if (f.range[0] !== 0 || f.range[1] !== NBINS - 1) p.set("r", `${f.range[0]}-${f.range[1]}`)
  if (f.mode === "dots") p.set("m", "dots")
  const qs = p.toString()
  history.replaceState(null, "", `${location.pathname}${qs ? `?${qs}` : ""}`)
}

/** class + vendor filters only: used for the time strips, which also show the out-of-range context faintly */
export const inScope = (d: Incident, f: Filters) => !f.hiddenClasses.includes(d.cls) && !f.hiddenVendors.includes(d.vendor)
export const inRange = (d: Incident, f: Filters) => d.bin >= f.range[0] && d.bin <= f.range[1]

export const scoped = (f: Filters) => incidents.filter((d) => inScope(d, f))
