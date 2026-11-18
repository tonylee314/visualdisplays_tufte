import { csvParse } from "d3-dsv"
import raw from "@/data/incidents.csv?raw"

export type Incident = {
  system: string
  cls: string
  cat: string
  vendor: string
  label: string // "May 2026"
  t: number // months since year 0, for sorting
  bin: number // half-year index, 0 = 2021 H1
}

const MONTHS: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 }

export const OTHER = "Other / non-vendor"

// "Affected agentic AI" mixes products with people/organisations harmed by AI output.
// Group products into vendor families by hand; first match wins; the rest is "Other / non-vendor".
const VENDORS: [string, RegExp][] = [
  ["Coding agents & dev tools", /codex|cursor|github|copilot cli|(?<!anthropic )mcp|a2a|postmark|coding assist|dev agent|developers using|cline|replit|flowise|langsmith|langchain|metagpt|lovable|figma|amazon q|visual studio|cortex|ai-generated/i],
  ["Anthropic", /claude|anthropic/i],
  ["OpenAI", /chatgpt|openai|gpt/i],
  ["xAI", /grok|^xai/i],
  ["Google", /gemini|bard|google/i],
  ["Microsoft", /microsoft|bing|semantic kernel|sharepoint|copilot/i],
  ["Meta", /^meta/i],
  ["Companion apps", /character\.?ai|replika|chai chatbot|nomi|glimpse|secret desires|tigerweb/i],
]
export const vendorOf = (name: string) => VENDORS.find(([, re]) => re.test(name))?.[0] ?? OTHER

export const incidents: Incident[] = csvParse(raw.replace(/^﻿/, ""))
  .filter((r) => r.Date && r.Category)
  .map((r) => {
    const [mon, yy] = r.Date!.split("-")
    const year = 2000 + +yy!
    const month = MONTHS[mon!]!
    return {
      system: r["Affected agentic AI"]!,
      cls: r.Class!,
      cat: r.Category!,
      vendor: vendorOf(r["Affected agentic AI"]!),
      label: `${mon} ${year}`,
      t: year * 12 + month,
      bin: (year - 2021) * 2 + (month >= 6 ? 1 : 0),
    }
  })
  // "Data exposure" is intentionally left out of this display (15 of the 192 logged rows)
  .filter((d) => d.cls !== "Data exposure")

export const NBINS = Math.max(...incidents.map((d) => d.bin)) + 1
export const binLabel = (b: number) => `${2021 + Math.floor(b / 2)} H${(b % 2) + 1}`

export const CLASS_ORDER = ["Safety/guardrail failure", "Security exploit"]
export const CLASS_LABEL: Record<string, string> = {
  "Safety/guardrail failure": "Safety / guardrail failure",
  "Security exploit": "Security exploit",
}
export const CLASS_SHORT: Record<string, string> = { "Safety/guardrail failure": "Safety", "Security exploit": "Security" }

const count = <T,>(xs: T[], key: (x: T) => string) => {
  const m = new Map<string, number>()
  xs.forEach((x) => m.set(key(x), (m.get(key(x)) ?? 0) + 1))
  return m
}

const catTotal = count(incidents, (d) => d.cat)
const catClass = new Map(incidents.map((d) => [d.cat, d.cls]))
const vTotal = count(incidents, (d) => d.vendor)

/** rows: grouped by class, biggest first within each class */
export const CATS = [...catTotal.keys()].sort(
  (a, b) => CLASS_ORDER.indexOf(catClass.get(a)!) - CLASS_ORDER.indexOf(catClass.get(b)!) || catTotal.get(b)! - catTotal.get(a)!,
)
export const classOf = (cat: string) => catClass.get(cat)!
/** columns in a fixed, editorial order: the big model labs first, then tooling, then everything else */
const VENDOR_ORDER = ["OpenAI", "Anthropic", "Google", "Meta", "xAI", "Microsoft", "Coding agents & dev tools", "Companion apps", OTHER]
export const VENDOR_LIST = [...VENDOR_ORDER.filter((v) => vTotal.has(v)), ...[...vTotal.keys()].filter((v) => !VENDOR_ORDER.includes(v))]
export const VENDOR_SHORT: Record<string, [string, string?]> = {
  "Coding agents & dev tools": ["Coding agents", "& dev tools"],
  "Companion apps": ["Companion", "apps"],
  [OTHER]: ["Other /", "non-vendor"],
}

// fixed scales so a shade / bar height means the same thing under every filter
const cellMax = Math.max(...count(incidents, (d) => `${d.cat}|${d.vendor}`).values())
export const CELL_MAX = cellMax
export const SPARK_MAX = Math.max(...count(incidents, (d) => `${d.cat}|${d.bin}`).values())
