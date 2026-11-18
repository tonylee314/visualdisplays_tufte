import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

function Slider({ className, value, defaultValue, ...props }: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const thumbs = Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [0]
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      value={value}
      defaultValue={defaultValue}
      className={cn("relative flex w-full touch-none items-center py-3 select-none data-[disabled]:opacity-50", className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {thumbs.map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className="block size-4 shrink-0 rounded-full border border-primary bg-background shadow-sm outline-none transition-[box-shadow] hover:ring-4 hover:ring-ring/30 focus-visible:ring-4 focus-visible:ring-ring/50"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
