"use client"

import * as React from "react"
import * as HeatGraphPrimitive from "heat-graph"

import { cn } from "@/lib/utils"

type HeatGraphCompositeProps<TMeta> = {
  data: HeatGraphPrimitive.DataPoint[]
  start: string | Date
  end: string | Date
  rowLabels: string[]
  columnLabels: string[]
  colorScale: readonly string[]
  classify?: HeatGraphPrimitive.ClassifyFn
  getMeta?: (cell: HeatGraphPrimitive.CellData) => TMeta | undefined
  getCellClassName?: (props: {
    cell: HeatGraphPrimitive.CellData
    meta: TMeta | undefined
  }) => string
  renderCellContent?: (props: {
    cell: HeatGraphPrimitive.CellData
    meta: TMeta | undefined
  }) => React.ReactNode
  renderTooltipContent?: (props: {
    cell: HeatGraphPrimitive.CellData
    meta: TMeta | undefined
  }) => React.ReactNode
  className?: string
  minWidth?: string
  lowLabel?: string
  highLabel?: string
}

export function HeatGraphComposite<TMeta>({
  data,
  start,
  end,
  rowLabels,
  columnLabels,
  colorScale,
  classify,
  getMeta,
  getCellClassName,
  renderCellContent,
  renderTooltipContent,
  className,
  minWidth = "42rem",
  lowLabel = "Less",
  highLabel = "More",
}: HeatGraphCompositeProps<TMeta>) {
  return (
    <HeatGraphPrimitive.Root
      data={data}
      start={start}
      end={end}
      weekStart="monday"
      classify={classify}
      colorScale={[...colorScale]}
      className={cn("grid gap-4", className)}
    >
      <div className="overflow-x-auto pb-1">
        <div className="grid gap-3" style={{ minWidth }}>
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `4.5rem repeat(${columnLabels.length}, minmax(0, 1fr))`,
            }}
          >
            <div />
            {columnLabels.map((label) => (
              <div key={label} className="heat-cell-label text-center">
                {label}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <div
              className="grid w-[4.5rem] shrink-0 gap-2"
              style={{
                gridTemplateRows: `repeat(${rowLabels.length}, minmax(0, 1fr))`,
              }}
            >
              {rowLabels.map((label) => (
                <div
                  key={label}
                  className="flex items-center justify-end pr-2 text-xs font-medium text-muted-foreground"
                >
                  {label}
                </div>
              ))}
            </div>

            <HeatGraphPrimitive.Grid
              className="min-w-0 flex-1 gap-2"
              style={{
                gridTemplateRows: `repeat(${rowLabels.length}, minmax(0, 1fr))`,
              }}
            >
              {({ cell }) => {
                if (cell.row >= rowLabels.length || cell.column >= columnLabels.length) {
                  return null
                }

                const meta = getMeta?.(cell)

                return (
                  <HeatGraphPrimitive.Cell
                    className={cn(
                      "grid min-h-22 gap-1 rounded-[0.9rem] border border-white/20 px-3 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-transform duration-150 hover:-translate-y-0.5",
                      getCellClassName?.({ cell, meta })
                    )}
                  >
                    {renderCellContent?.({ cell, meta })}
                  </HeatGraphPrimitive.Cell>
                )
              }}
            </HeatGraphPrimitive.Grid>
          </div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
        <span>{lowLabel}</span>
        <HeatGraphPrimitive.Legend>
          {() => (
            <HeatGraphPrimitive.LegendLevel className="h-3 w-6 rounded-full border border-white/20" />
          )}
        </HeatGraphPrimitive.Legend>
        <span>{highLabel}</span>
      </div>

      {renderTooltipContent ? (
        <HeatGraphPrimitive.Tooltip className="pointer-events-none max-w-64 rounded-md bg-popover px-3 py-2 text-popover-foreground shadow-lg">
          {({ cell }) => renderTooltipContent({ cell, meta: getMeta?.(cell) })}
        </HeatGraphPrimitive.Tooltip>
      ) : null}
    </HeatGraphPrimitive.Root>
  )
}
