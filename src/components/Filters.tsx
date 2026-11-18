import { ChevronDownIcon, RotateCcwIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { CLASS_LABEL, CLASS_ORDER, CLASS_SHORT, NBINS, VENDOR_LIST, binLabel } from "@/lib/data"
import { DEFAULT_FILTERS, isFiltered, type Filters, type Mode } from "@/lib/filters"

const toggle = (xs: string[], x: string) => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x])

export function FilterBar({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  const set = (p: Partial<Filters>) => onChange({ ...filters, ...p })
  const nHiddenV = filters.hiddenVendors.length
  const visibleClasses = CLASS_ORDER.filter((c) => !filters.hiddenClasses.includes(c))

  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-4" role="group" aria-label="Filters">
      <div className="space-y-1.5">
        <div id="lbl-class" className="text-xs font-medium text-muted-foreground">Class</div>
        <ToggleGroup
          type="multiple" aria-labelledby="lbl-class" value={visibleClasses}
          onValueChange={(v) => v.length > 0 && set({ hiddenClasses: CLASS_ORDER.filter((c) => !v.includes(c)) })}
        >
          {CLASS_ORDER.map((c) => (
            <ToggleGroupItem key={c} value={c} aria-label={CLASS_LABEL[c]}>{CLASS_SHORT[c]}</ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="space-y-1.5">
        <div className="text-xs font-medium text-muted-foreground">Vendor</div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="min-w-36 justify-between font-normal">
              {nHiddenV === 0 ? "All vendors" : <>Vendors <Badge variant="secondary">{VENDOR_LIST.length - nHiddenV}/{VENDOR_LIST.length}</Badge></>}
              <ChevronDownIcon className="opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Show vendor families</DropdownMenuLabel>
            {VENDOR_LIST.map((v) => (
              <DropdownMenuCheckboxItem
                key={v} checked={!filters.hiddenVendors.includes(v)} onSelect={(e) => e.preventDefault()}
                onCheckedChange={() => VENDOR_LIST.length - nHiddenV > 1 || filters.hiddenVendors.includes(v) ? set({ hiddenVendors: toggle(filters.hiddenVendors, v) }) : undefined}
              >
                {v}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); set({ hiddenVendors: [] }) }}>Show all</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="min-w-56 flex-1 basis-64 space-y-0.5 sm:max-w-sm">
        <div className="flex items-baseline justify-between text-xs">
          <span id="lbl-range" className="font-medium text-muted-foreground">Period</span>
          <span className="tabular-nums" aria-live="polite">{binLabel(filters.range[0])} – {binLabel(filters.range[1])}</span>
        </div>
        <Slider
          aria-labelledby="lbl-range" min={0} max={NBINS - 1} step={1} value={filters.range}
          onValueChange={(v) => set({ range: [v[0]!, v[1]!] })}
        />
      </div>

      <div className="space-y-1.5">
        <div id="lbl-cells" className="text-xs font-medium text-muted-foreground">Cells</div>
        <ToggleGroup type="single" aria-labelledby="lbl-cells" value={filters.mode} onValueChange={(v) => v && set({ mode: v as Mode })}>
          <ToggleGroupItem value="shade">Shade</ToggleGroupItem>
          <ToggleGroupItem value="dots">Dots</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {isFiltered(filters) && (
        <Button variant="ghost" size="sm" onClick={() => onChange({ ...DEFAULT_FILTERS, mode: filters.mode })} className="mb-0.5">
          <RotateCcwIcon /> Reset filters
        </Button>
      )}
    </div>
  )
}
