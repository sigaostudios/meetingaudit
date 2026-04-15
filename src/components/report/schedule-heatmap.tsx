"use client"

import * as React from "react"
import type { DataPoint } from "heat-graph"

import { HeatGraphComposite } from "@/components/heat-graph"
import { formatHoursFromMinutes } from "@/lib/reporting"
import { TIME_BUCKETS, WEEKDAYS, type HeatCellMetric, type TimeBucketLabel, type Weekday } from "@/types/report"

const HEAT_COLORS = [
  "color-mix(in oklch, var(--muted) 90%, white 10%)",
  "color-mix(in oklch, var(--chart-3) 32%, white 68%)",
  "color-mix(in oklch, var(--chart-2) 58%, white 42%)",
  "color-mix(in oklch, var(--chart-1) 72%, white 28%)",
  "color-mix(in oklch, var(--chart-1) 92%, black 4%)",
] as const

const VISIBLE_TIME_BUCKETS = TIME_BUCKETS.slice(4, 9)
const SYNTHETIC_GRID_START = new Date(2024, 0, 1)
const SYNTHETIC_GRID_END = new Date(2024, 1, 2)

function quantileClassify(weights: number[]) {
  const positives = weights.filter((weight) => weight > 0).sort((left, right) => left - right)

  if (!positives.length) {
    return () => 0
  }

  const pick = (position: number) =>
    positives[Math.min(positives.length - 1, Math.floor((positives.length - 1) * position))]

  const thresholds = [pick(0.2), pick(0.45), pick(0.7), pick(0.9)]

  return (weight: number) => {
    if (weight <= 0) return 0
    if (weight <= thresholds[0]) return 1
    if (weight <= thresholds[1]) return 2
    if (weight <= thresholds[2]) return 3
    return 4
  }
}

type ScheduleHeatmapProps = {
  cells: HeatCellMetric[]
}

export function ScheduleHeatmap({ cells }: ScheduleHeatmapProps) {
  const visibleCells = React.useMemo(
    () => cells.filter((cell) => VISIBLE_TIME_BUCKETS.includes(cell.bucketLabel)),
    [cells]
  )

  const cellMetaByDate = React.useMemo(
    () =>
      new Map(
        visibleCells.map((cell) => [getSyntheticDateKey(cell.weekday, cell.bucketLabel), cell])
      ),
    [visibleCells]
  )

  const data = React.useMemo<DataPoint[]>(
    () =>
      visibleCells.map((cell) => ({
        date: getSyntheticDateKey(cell.weekday, cell.bucketLabel),
        count: cell.weight,
      })),
    [visibleCells]
  )

  return (
    <div className="grid gap-4">
      <HeatGraphComposite<HeatCellMetric>
        data={data}
        start={SYNTHETIC_GRID_START}
        end={SYNTHETIC_GRID_END}
        rowLabels={WEEKDAYS.map((weekday) => weekday.slice(0, 3))}
        columnLabels={VISIBLE_TIME_BUCKETS.map((label) => label.slice(0, 5))}
        colorScale={HEAT_COLORS}
        classify={quantileClassify}
        getCellClassName={({ cell }) =>
          cell.level > 0 ? "text-slate-950" : "text-slate-100"
        }
        getMeta={(cell) =>
          cellMetaByDate.get(formatDateKey(cell.date)) ??
          createEmptyCell(WEEKDAYS[cell.row]!, VISIBLE_TIME_BUCKETS[cell.column]!)
        }
        renderCellContent={({ meta }) =>
          meta ? (
            <>
              <span className="font-mono text-sm font-medium tabular-nums">
                {meta.weight > 0 ? formatHoursFromMinutes(meta.weight) : "0.0h"}
              </span>
              <span className="text-xs opacity-78">
                {meta.meetingCount > 0
                  ? `${meta.meetingCount} recurring meeting${meta.meetingCount === 1 ? "" : "s"}`
                  : "No recurring meetings"}
              </span>
            </>
          ) : null
        }
        renderTooltipContent={({ meta }) =>
          meta ? (
            <div className="grid gap-1">
              <div className="font-medium">{meta.weekday} / {meta.bucketLabel}</div>
              <div className="text-muted-foreground">
                Meetings that start in this 2-hour block
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className="text-muted-foreground">Weekly attendee load</span>
                <span className="font-mono tabular-nums text-foreground">
                  {Math.round(meta.weight).toLocaleString()} min
                </span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className="text-muted-foreground">Recurring meetings</span>
                <span className="font-mono tabular-nums text-foreground">
                  {meta.meetingCount}
                </span>
              </div>
            </div>
          ) : null
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
        <p>
          Each cell shows total weekly attendee-hours for meetings that start in that
          weekday and 2-hour block.
        </p>
      </div>
    </div>
  )
}

function getSyntheticDateKey(weekday: Weekday, bucketLabel: TimeBucketLabel) {
  const date = new Date(SYNTHETIC_GRID_START)
  const dayOffset =
    VISIBLE_TIME_BUCKETS.indexOf(bucketLabel) * 7 + WEEKDAYS.indexOf(weekday)

  date.setDate(SYNTHETIC_GRID_START.getDate() + dayOffset)

  return formatDateKey(date)
}

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function createEmptyCell(weekday: Weekday, bucketLabel: TimeBucketLabel): HeatCellMetric {
  return {
    date: "",
    weekday,
    bucketIndex: TIME_BUCKETS.indexOf(bucketLabel),
    bucketLabel,
    weight: 0,
    meetingCount: 0,
  }
}
