import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"
import { cn } from "@/lib/utils"

function Drawer(props: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />
}

function DrawerContent({ className, children, ...props }: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  return (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn("fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[85dvh] flex-col rounded-t-xl border-t bg-background outline-none", className)}
        {...props}
      >
        <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/30" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPrimitive.Portal>
  )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5 p-4", className)} {...props} />
}
function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return <DrawerPrimitive.Title className={cn("font-semibold text-foreground", className)} {...props} />
}
function DrawerDescription({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return <DrawerPrimitive.Description className={cn("text-sm text-muted-foreground", className)} {...props} />
}

export { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription }
