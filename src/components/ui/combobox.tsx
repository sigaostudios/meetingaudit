"use client"

import { useControllableState } from "@radix-ui/react-use-controllable-state"
import { ChevronsUpDownIcon, PlusIcon } from "lucide-react"
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface ComboboxData {
  label: string
  value: string
}

interface ComboboxContextType {
  data: ComboboxData[]
  type: string
  value: string
  onValueChange: (value: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  width: number
  setWidth: (width: number) => void
  inputValue: string
  setInputValue: (value: string) => void
}

const ComboboxContext = createContext<ComboboxContextType | null>(null)

function useComboboxContext() {
  const context = useContext(ComboboxContext)
  if (!context) {
    throw new Error("Combobox subcomponents must be used inside <Combobox>.")
  }

  return context
}

export type ComboboxProps = ComponentProps<typeof Popover> & {
  data: ComboboxData[]
  type: string
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const Combobox = ({
  data,
  type,
  defaultValue,
  value: controlledValue,
  onValueChange: controlledOnValueChange,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  ...props
}: ComboboxProps) => {
  const [value, onValueChange] = useControllableState<string>({
    defaultProp: defaultValue ?? "",
    prop: controlledValue,
    onChange: controlledOnValueChange,
  })
  const [open, onOpenChange] = useControllableState<boolean>({
    defaultProp: defaultOpen,
    prop: controlledOpen,
    onChange: controlledOnOpenChange,
  })
  const [width, setWidth] = useState(200)
  const [inputValue, setInputValue] = useState("")

  return (
    <ComboboxContext.Provider
      value={{
        type,
        value,
        onValueChange,
        open,
        onOpenChange,
        data,
        width,
        setWidth,
        inputValue,
        setInputValue,
      }}
    >
      <Popover {...props} onOpenChange={onOpenChange} open={open} />
    </ComboboxContext.Provider>
  )
}

export type ComboboxTriggerProps = ComponentProps<typeof Button>

export const ComboboxTrigger = ({ children, ...props }: ComboboxTriggerProps) => {
  const { value, data, type, setWidth } = useComboboxContext()
  const ref = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = (entry.target as HTMLElement).offsetWidth
        if (newWidth) {
          setWidth(newWidth)
        }
      }
    })

    if (ref.current) {
      resizeObserver.observe(ref.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [setWidth])

  return (
    <PopoverTrigger
      render={
        <Button variant="outline" {...props} ref={ref}>
          {children ?? (
            <span className="flex w-full items-center justify-between gap-2">
              {value ? data.find((item) => item.value === value)?.label : `Select ${type}...`}
              <ChevronsUpDownIcon className="shrink-0 text-muted-foreground" size={16} />
            </span>
          )}
        </Button>
      }
    />
  )
}

export type ComboboxContentProps = ComponentProps<typeof Command> & {
  popoverOptions?: ComponentProps<typeof PopoverContent>
}

export const ComboboxContent = ({ className, popoverOptions, ...props }: ComboboxContentProps) => {
  const { width } = useComboboxContext()

  return (
    <PopoverContent className={cn("p-0", className)} style={{ width }} {...popoverOptions}>
      <Command {...props} />
    </PopoverContent>
  )
}

export type ComboboxInputProps = ComponentProps<typeof CommandInput> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

export const ComboboxInput = ({
  value: controlledValue,
  defaultValue,
  onValueChange: controlledOnValueChange,
  ...props
}: ComboboxInputProps) => {
  const { type, inputValue, setInputValue } = useComboboxContext()

  const [value, onValueChange] = useControllableState<string>({
    defaultProp: defaultValue ?? inputValue,
    prop: controlledValue,
    onChange: (newValue) => {
      setInputValue(newValue)
      controlledOnValueChange?.(newValue)
    },
  })

  return (
    <CommandInput
      onValueChange={onValueChange}
      placeholder={`Search ${type}...`}
      value={value}
      {...props}
    />
  )
}

export type ComboboxListProps = ComponentProps<typeof CommandList>

export const ComboboxList = (props: ComboboxListProps) => <CommandList {...props} />

export type ComboboxEmptyProps = ComponentProps<typeof CommandEmpty>

export const ComboboxEmpty = ({ children, ...props }: ComboboxEmptyProps) => {
  const { type } = useComboboxContext()

  return <CommandEmpty {...props}>{children ?? `No ${type} found.`}</CommandEmpty>
}

export type ComboboxGroupProps = ComponentProps<typeof CommandGroup>

export const ComboboxGroup = (props: ComboboxGroupProps) => <CommandGroup {...props} />

export type ComboboxItemProps = ComponentProps<typeof CommandItem>

export const ComboboxItem = ({ onSelect, ...props }: ComboboxItemProps) => {
  const { onValueChange, onOpenChange } = useComboboxContext()

  return (
    <CommandItem
      onSelect={(currentValue) => {
        onSelect?.(currentValue)
        onValueChange(currentValue)
        onOpenChange(false)
      }}
      {...props}
    />
  )
}

export type ComboboxSeparatorProps = ComponentProps<typeof CommandSeparator>

export const ComboboxSeparator = (props: ComboboxSeparatorProps) => (
  <CommandSeparator {...props} />
)

export interface ComboboxCreateNewProps {
  onCreateNew: (value: string) => void
  children?: (inputValue: string) => ReactNode
  className?: string
}

export const ComboboxCreateNew = ({ onCreateNew, children, className }: ComboboxCreateNewProps) => {
  const { inputValue, type, onValueChange, onOpenChange } = useComboboxContext()

  if (!inputValue.trim()) {
    return null
  }

  const handleCreateNew = () => {
    const value = inputValue.trim()
    onCreateNew(value)
    onValueChange(value)
    onOpenChange(false)
  }

  return (
    <button
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      onClick={handleCreateNew}
      type="button"
    >
      {children ? (
        children(inputValue)
      ) : (
        <>
          <PlusIcon className="size-4 text-muted-foreground" />
          <span>
            Create new {type}: &quot;{inputValue}&quot;
          </span>
        </>
      )}
    </button>
  )
}
