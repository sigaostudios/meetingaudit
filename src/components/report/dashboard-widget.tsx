import type { ReactNode } from "react"
import { CircleHelpIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { DashboardWidgetSpan } from "@/types/dashboard"

const SPAN_CLASSES: Record<DashboardWidgetSpan, string> = {
  full: "xl:col-span-12",
  wide: "xl:col-span-7",
  narrow: "xl:col-span-5",
  half: "xl:col-span-6",
}

export type DashboardWidgetProps<TData> = {
  id?: string
  colSpan: DashboardWidgetSpan
  title: string
  description: string
  tooltip: string
  content: ReactNode
  data: TData
  className?: string
  contentClassName?: string
  headerAction?: ReactNode
}

export function DashboardWidget<TData>({
  id,
  colSpan,
  title,
  description,
  tooltip,
  content,
  data,
  className,
  contentClassName,
  headerAction,
}: DashboardWidgetProps<TData>) {
  void data

  return (
    <section id={id} className={cn("min-w-0", SPAN_CLASSES[colSpan])}>
      <Card
        className={cn(
          "report-card min-w-0 rounded-[1.15rem] border border-border/60 bg-background/40",
          className
        )}
      >
        <CardHeader className="gap-3 border-b border-border/50 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <CardTitle className="text-[1.35rem] leading-tight sm:text-[1.5rem]">
                <TitleWithDefinition title={title} definition={tooltip} />
              </CardTitle>
              <CardDescription className="max-w-[52rem] text-sm leading-6">
                {description}
              </CardDescription>
            </div>
            {headerAction}
          </div>
        </CardHeader>
        <CardContent className={cn("min-w-0 pt-5", contentClassName)}>{content}</CardContent>
      </Card>
    </section>
  )
}

export function DefinitionTooltip({ definition }: { definition: string }) {
  return (
    <Tooltip>
      <TooltipTrigger className="inline-flex rounded-full text-muted-foreground transition-colors hover:text-foreground">
        <CircleHelpIcon className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent className="max-w-72 bg-foreground text-background">
        {definition}
      </TooltipContent>
    </Tooltip>
  )
}

export function TitleWithDefinition({
  title,
  definition,
}: {
  title: string
  definition: string
}) {
  return (
    <span className="flex items-center gap-2">
      <span>{title}</span>
      <DefinitionTooltip definition={definition} />
    </span>
  )
}
