import * as React from "react"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

function ToggleGroup({ className, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn("flex w-fit items-center rounded-md shadow-xs", className)}
      {...props}
    />
  )
}

function ToggleGroupItem({ className, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(
        "inline-flex h-9 min-w-9 items-center justify-center gap-2 border px-3 text-sm font-medium whitespace-nowrap",
        "transition-[color,background-color,transform] duration-150 ease-(--ease-out-strong) outline-none",
        "first:rounded-l-md last:rounded-r-md not-first:-ml-px",
        "hover:bg-accent hover:text-accent-foreground active:scale-[0.97]",
        "focus-visible:z-10 focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "data-[state=on]:bg-accent data-[state=on]:text-accent-foreground data-[state=off]:text-muted-foreground",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}

export { ToggleGroup, ToggleGroupItem }
