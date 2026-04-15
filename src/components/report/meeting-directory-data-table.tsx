"use client"

import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { formatMetricMinutes } from "@/lib/reporting"
import type { MeetingRecord } from "@/types/report"

const pageSizes = [10, 25, 50] as const

const textIncludesFilter: FilterFn<MeetingRecord> = (row, columnId, value) => {
  const query = String(value).trim().toLowerCase()
  if (!query) return true

  return String(row.getValue(columnId)).toLowerCase().includes(query)
}

const exactMatchFilter: FilterFn<MeetingRecord> = (row, columnId, value) => {
  const query = String(value).trim()
  if (!query) return true

  return String(row.getValue(columnId)) === query
}

const columns: ColumnDef<MeetingRecord>[] = [
  {
    accessorKey: "meeting_name",
    filterFn: textIncludesFilter,
    header: ({ column }) => <SortHeader column={column} title="Meeting" className="w-[22%] min-w-[14rem]" />,
    cell: ({ row }) => {
      const meeting = row.original

      return (
        <div className="grid gap-1 whitespace-normal">
          <div>
            <p className="font-medium">{meeting.meeting_name}</p>
            <p className="text-xs text-muted-foreground">
              {meeting.time} / {meeting.timeBucketLabel}
            </p>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "owner_name",
    filterFn: textIncludesFilter,
    header: ({ column }) => <SortHeader column={column} title="Owner" className="w-[10rem]" />,
    cell: ({ row }) => <span className="whitespace-normal">{row.original.owner_name}</span>,
  },
  {
    accessorKey: "cadence",
    filterFn: exactMatchFilter,
    header: ({ column }) => <SortHeader column={column} title="Cadence" className="w-[18%] min-w-[12rem]" />,
    cell: ({ row }) => {
      const meeting = row.original

      return (
        <div className="grid gap-1 whitespace-normal">
          <Badge variant="secondary" className="w-fit rounded-full">
            {meeting.cadence}
          </Badge>
          <p className="text-xs text-muted-foreground">
            {meeting.weekdays.length ? meeting.weekdays.join(", ") : "No weekday provided"}
          </p>
        </div>
      )
    },
  },
  {
    accessorKey: "attendeeCount",
    header: ({ column }) => <SortHeader column={column} title="Attendees" className="w-[20%] min-w-[14rem]" />,
    cell: ({ row }) => {
      const meeting = row.original

      return (
        <div className="max-w-[16rem] whitespace-normal">
          <p>{meeting.attendeeCount} people</p>
          <p className="text-xs text-muted-foreground">{meeting.attendeeList.join(", ")}</p>
        </div>
      )
    },
  },
  {
    accessorKey: "clientLabel",
    filterFn: exactMatchFilter,
    header: ({ column }) => <SortHeader column={column} title="Client" className="w-[8rem]" />,
    cell: ({ row }) => {
      const meeting = row.original

      return (
        <Badge className="rounded-full" variant={meeting.isInternal ? "secondary" : "outline"}>
          {meeting.clientLabel}
        </Badge>
      )
    },
  },
  {
    id: "notes",
    accessorFn: (row) => row.dataNotes.join(" "),
    filterFn: textIncludesFilter,
    header: ({ column }) => <SortHeader column={column} title="Notes" className="w-[20%] min-w-[14rem]" />,
    cell: ({ row }) => {
      const notes = row.original.dataNotes

      if (!notes.length) {
        return <span className="text-sm text-muted-foreground">No notes</span>
      }

      return (
        <div className="grid gap-2 whitespace-normal">
          {notes.map((note) => (
            <div
              key={note}
              className="rounded-lg border border-border/70 bg-muted/35 px-3 py-2 text-sm leading-5 whitespace-normal break-words text-foreground/90"
            >
              {note}
            </div>
          ))}
        </div>
      )
    },
  },
  {
    accessorKey: "weeklyWeightedAttendeeMinutes",
    header: ({ column }) => <SortHeader column={column} title="Weekly load" className="w-[9rem] justify-end" />,
    cell: ({ row }) => {
      const meeting = row.original

      return (
        <div className="grid gap-1 text-right whitespace-normal">
          <p className="font-mono text-sm font-medium tabular-nums">
            {formatMetricMinutes(meeting.weeklyWeightedAttendeeMinutes)}
          </p>
          <p className="text-xs text-muted-foreground">
            {meeting.durationMinutes} min x {meeting.attendeeCount} x {meeting.cadenceFactor}
          </p>
        </div>
      )
    },
  },
]

export function MeetingDirectoryDataTable({ meetings }: { meetings: MeetingRecord[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "weeklyWeightedAttendeeMinutes", desc: true },
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

  const clientOptions = React.useMemo(
    () =>
      [...new Set(meetings.map((meeting) => meeting.clientLabel))]
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right)),
    [meetings]
  )

  const cadenceOptions = React.useMemo(
    () =>
      [...new Set(meetings.map((meeting) => meeting.cadence))]
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right)),
    [meetings]
  )

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table manages its own imperative table API.
  const table = useReactTable({
    data: meetings,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const filteredCount = table.getFilteredRowModel().rows.length
  const startRow = filteredCount === 0 ? 0 : pageIndex * pageSize + 1
  const endRow = Math.min((pageIndex + 1) * pageSize, filteredCount)
  const hasColumnFilters = columnFilters.length > 0

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <div className="text-sm text-muted-foreground">
          {filteredCount.toLocaleString()} of {meetings.length.toLocaleString()} meetings
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-border/70 bg-background/35 p-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_12rem_12rem_minmax(0,1fr)_auto]">
        <FilterField
          label="Meeting"
          value={(table.getColumn("meeting_name")?.getFilterValue() as string) ?? ""}
          onChange={(value) => table.getColumn("meeting_name")?.setFilterValue(value)}
          placeholder="Filter meeting name"
        />
        <FilterField
          label="Owner"
          value={(table.getColumn("owner_name")?.getFilterValue() as string) ?? ""}
          onChange={(value) => table.getColumn("owner_name")?.setFilterValue(value)}
          placeholder="Filter owner"
        />
        <FilterSelect
          label="Client"
          value={(table.getColumn("clientLabel")?.getFilterValue() as string) ?? ""}
          onChange={(value) => table.getColumn("clientLabel")?.setFilterValue(value)}
          options={clientOptions}
        />
        <FilterSelect
          label="Cadence"
          value={(table.getColumn("cadence")?.getFilterValue() as string) ?? ""}
          onChange={(value) => table.getColumn("cadence")?.setFilterValue(value)}
          options={cadenceOptions}
        />
        <FilterField
          label="Notes"
          value={(table.getColumn("notes")?.getFilterValue() as string) ?? ""}
          onChange={(value) => table.getColumn("notes")?.setFilterValue(value)}
          placeholder="Filter note content"
        />
        <div className="flex items-end">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={!hasColumnFilters}
            onClick={() => setColumnFilters([])}
          >
            Clear filters
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-background/40">
        <Table className="w-full table-fixed [&_td]:align-top">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getVisibleLeafColumns().length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No meetings match the current filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {startRow}-{endRow} of {filteredCount.toLocaleString()}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            {pageSizes.map((size) => (
              <Button
                key={size}
                type="button"
                size="sm"
                variant={pageSize === size ? "secondary" : "outline"}
                onClick={() => table.setPageSize(size)}
              >
                {size}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeftIcon />
              Previous
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

type FilterFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}

function FilterField({ label, value, onChange, placeholder }: FilterFieldProps) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      <Input
        value={value}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        placeholder={placeholder}
        className="bg-background/75"
      />
    </label>
  )
}

type FilterSelectProps = {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
}

function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="flex h-8 w-full rounded-lg border border-border bg-background/75 px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

type SortHeaderProps = {
  column: {
    getCanSort: () => boolean
    getIsSorted: () => false | "asc" | "desc"
    toggleSorting: (desc?: boolean) => void
  }
  title: string
  className?: string
}

function SortHeader({ column, title, className }: SortHeaderProps) {
  if (!column.getCanSort()) {
    return <div className={className}>{title}</div>
  }

  const sorted = column.getIsSorted()

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn("-ml-3 h-8 gap-1 px-3 text-foreground/80 hover:text-foreground", className)}
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      <span>{title}</span>
      {sorted === "asc" ? (
        <ArrowUpIcon className="size-4" />
      ) : sorted === "desc" ? (
        <ArrowDownIcon className="size-4" />
      ) : (
        <ArrowUpDownIcon className="size-4 opacity-70" />
      )}
    </Button>
  )
}
