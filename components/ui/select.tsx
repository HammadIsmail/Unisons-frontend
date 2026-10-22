"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from "lucide-react"

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1.5", className)}
      {...props}
    />
  )
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        // Base layout
        "group flex w-fit items-center justify-between gap-2 rounded-lg border px-3 text-sm whitespace-nowrap select-none outline-none transition-all duration-200",
        // Blue/white theme
        "border-blue-200 bg-white text-black shadow-sm",
        // Hover
        "hover:border-blue-400 hover:bg-blue-50 hover:shadow-md",
        // Focus
        "focus-visible:border-blue-500 focus-visible:ring-3 focus-visible:ring-blue-300/50",
        // Open state
        "data-[state=open]:border-blue-500 data-[state=open]:bg-blue-50 data-[state=open]:ring-3 data-[state=open]:ring-blue-300/50",
        // Placeholder
        "data-placeholder:text-blue-400",
        // Sizes
        "data-[size=default]:h-10 data-[size=sm]:h-8 data-[size=sm]:rounded-md data-[size=sm]:px-2.5 data-[size=sm]:text-xs",
        // Disabled
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Invalid
        "aria-invalid:border-red-400 aria-invalid:ring-3 aria-invalid:ring-red-200",
        // Value slot
        "*:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5",
        // SVG
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="pointer-events-none size-4 text-blue-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

// Track open state for staggered item animations
const SelectOpenContext = React.createContext(false)

function SelectContent({
  className,
  children,
  position = "popper",
  align = "start",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <SelectOpenContext.Provider value={isOpen}>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          data-slot="select-content"
          onAnimationStart={() => setIsOpen(true)}
          onAnimationEnd={() => {}}
          className={cn(
            // Base
            "relative z-50 max-h-[min(320px,var(--radix-select-content-available-height))] min-w-[--radix-select-trigger-width] origin-[--radix-select-content-transform-origin] overflow-x-hidden overflow-y-auto",
            // Blue/white theme
            "rounded-xl border border-blue-100 bg-white text-blue-900 shadow-xl shadow-blue-900/10",
            // Top accent line
            "before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:rounded-t-xl before:bg-gradient-to-r before:from-blue-400 before:via-blue-500 before:to-blue-400",
            // Open animation
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            // Close animation
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            // Side animations
            "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            // Popper offset
            position === "popper" && "data-[side=bottom]:translate-y-1.5 data-[side=top]:-translate-y-1.5",
            className
          )}
          position={position}
          align={align}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.Viewport
            data-position={position}
            className={cn(
              "p-1.5",
              position === "popper" &&
                "h-[--radix-select-trigger-height] w-full min-w-[--radix-select-trigger-width]"
            )}
          >
            {children}
          </SelectPrimitive.Viewport>
          <SelectScrollDownButton />
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectOpenContext.Provider>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn(
        "px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-400",
        className
      )}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  index = 0,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item> & { index?: number }) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        // Base layout
        "relative flex w-full cursor-default items-center gap-2 rounded-lg py-2 pr-8 pl-2.5 text-sm outline-hidden select-none",
        // Blue/white theme
        "text-blue-800",
        // Hover / focus
        "focus:bg-blue-50 focus:text-blue-900",
        // Animated entry — stagger via inline style below
        "animate-in fade-in-0 slide-in-from-left-2",
        // Disabled
        "data-disabled:pointer-events-none data-disabled:opacity-40",
        // SVG
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "*:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      style={{
        animationDelay: `${index * 35}ms`,
        animationFillMode: "both",
        animationDuration: "200ms",
      }}
      {...props}
    >
      <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-3.5 text-blue-500" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1.5 h-px bg-blue-100", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "z-10 flex cursor-default items-center justify-center bg-white py-1.5 text-blue-400 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronUpIcon />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "z-10 flex cursor-default items-center justify-center bg-white py-1.5 text-blue-400 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronDownIcon />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}