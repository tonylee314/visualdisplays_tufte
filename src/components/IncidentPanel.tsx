import { Badge } from "@/components/ui/badge"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import type { Incident } from "@/lib/data"
import type { Sel } from "./Heatmap"

function List({ items, showCat }: { items: Incident[]; showCat: boolean }) {
  return (
    <ol className="flex-1 divide-y overflow-y-auto overscroll-contain px-4 pb-6 text-sm">
      {items.map((d, i) => (
        <li key={i} className="flex gap-3 py-2">
          <span className="w-20 shrink-0 text-muted-foreground tabular-nums">{d.label}</span>
          <span className="min-w-0">
            {d.system}
            {showCat && <span className="block text-xs text-muted-foreground">{d.cat}</span>}
          </span>
        </li>
      ))}
    </ol>
  )
}

/** Sheet on desktop, Vaul drawer (drag to dismiss) on phones. Closing clears the selection. */
export function IncidentPanel({ sel, items, onClose }: { sel: Sel; items: Incident[]; onClose: () => void }) {
  const desktop = useMediaQuery("(min-width: 768px)")
  const open = !!(sel.cat || sel.vendor)
  const title = [sel.cat, sel.vendor].filter(Boolean).join(" × ")
  const sorted = [...items].sort((a, b) => b.t - a.t)
  const head = (
    <>
      <span className="flex items-center gap-2">{title}<Badge variant="secondary">{sorted.length}</Badge></span>
    </>
  )
  const desc = "Newest first, within the current filters."

  if (desktop)
    return (
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent aria-describedby="panel-desc">
          <SheetHeader>
            <SheetTitle>{head}</SheetTitle>
            <SheetDescription id="panel-desc">{desc}</SheetDescription>
          </SheetHeader>
          <List items={sorted} showCat={!sel.cat} />
        </SheetContent>
      </Sheet>
    )
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent aria-describedby="panel-desc">
        <DrawerHeader>
          <DrawerTitle>{head}</DrawerTitle>
          <DrawerDescription id="panel-desc">{desc}</DrawerDescription>
        </DrawerHeader>
        <List items={sorted} showCat={!sel.cat} />
      </DrawerContent>
    </Drawer>
  )
}
