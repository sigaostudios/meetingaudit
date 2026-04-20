"use client"

import { useMemo, useState } from "react"
import { CheckIcon, PlusIcon, XIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const NO_COMMAND_SELECTION = "__facet_filter_no_selection__"

export type FacetOption = {
  value: string
  label: string
}

type FacetFilterProps = {
  label: string
  options: FacetOption[]
  selectedValues: string[]
  counts: Map<string, number>
  onToggleValue: (value: string) => void
}

export function FacetFilter({
  label,
  options,
  selectedValues,
  counts,
  onToggleValue,
}: FacetFilterProps) {
  const [open, setOpen] = useState(false)
  const [commandValue, setCommandValue] = useState(NO_COMMAND_SELECTION)
  const selectedCount = selectedValues.length

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)

    if (nextOpen) {
      setCommandValue(NO_COMMAND_SELECTION)
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-9 rounded-xl border-dashed bg-background/85 px-3 shadow-none backdrop-blur",
              selectedCount > 0 && "border-primary/55 bg-primary/8 text-foreground"
            )}
          >
            <PlusIcon className="size-4" />
            <span>{label}</span>
            {selectedCount > 0 ? (
              <Badge
                variant="secondary"
                className="rounded-lg border border-primary/20 bg-primary/12 px-1.5 text-[11px] text-foreground"
              >
                {selectedCount}
              </Badge>
            ) : null}
          </Button>
        }
      />
      <PopoverContent
        align="start"
        initialFocus={(openType) => openType === "keyboard"}
        className="w-72 rounded-xl p-0"
      >
        <Command value={commandValue} onValueChange={setCommandValue}>
          <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />
          <CommandList className="max-h-80 p-1">
            <CommandEmpty>No {label.toLowerCase()} found.</CommandEmpty>
            <CommandGroup heading={label}>
              {options.map((option) => {
                const isSelected = selectedValues.includes(option.value)
                const count = counts.get(option.value) ?? 0

                return (
                  <CommandItem
                    key={`${label}-${option.value}`}
                    value={option.label}
                    data-checked={isSelected}
                    disabled={count === 0 && !isSelected}
                    onSelect={() => onToggleValue(option.value)}
                    className="rounded-xl px-3 py-2"
                  >
                    <span
                      className={cn(
                        "flex size-4 items-center justify-center rounded-[5px] border border-border/70 bg-background/70",
                        isSelected && "border-primary/70 bg-primary text-primary-foreground"
                      )}
                    >
                      {isSelected ? <CheckIcon className="size-3" /> : null}
                    </span>
                    <span className="flex-1">{option.label}</span>
                    <CommandShortcut className="text-xs tracking-normal text-muted-foreground">
                      {count}
                    </CommandShortcut>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
          {selectedCount > 0 ? (
            <div className="border-t border-border/70 p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center rounded-xl"
                onClick={() => {
                  for (const selectedValue of selectedValues) {
                    onToggleValue(selectedValue)
                  }
                }}
              >
                Clear {label.toLowerCase()}
              </Button>
            </div>
          ) : null}
        </Command>
      </PopoverContent>
    </Popover>
  )
}

type ActiveFacetChipsProps = {
  facetLabel: string
  options: FacetOption[]
  selectedValues: string[]
  onRemoveValue: (value: string) => void
}

export function ActiveFacetChips({
  facetLabel,
  options,
  selectedValues,
  onRemoveValue,
}: ActiveFacetChipsProps) {
  const labelByValue = useMemo(
    () => new Map(options.map((option) => [option.value, option.label])),
    [options]
  )

  return (
    <>
      {selectedValues.map((value) => (
        <button
          key={`${facetLabel}-${value}`}
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-background/80 px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary/40 hover:bg-primary/6"
          onClick={() => onRemoveValue(value)}
        >
          <span className="text-muted-foreground">{facetLabel}:</span>
          <span>{labelByValue.get(value) ?? value}</span>
          <XIcon className="size-3.5 text-muted-foreground" />
        </button>
      ))}
    </>
  )
}
