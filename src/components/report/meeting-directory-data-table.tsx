"use client"

import * as React from "react"
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
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
  UserRoundIcon,
  UsersIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ActiveFacetChips,
  FacetFilter,
  type FacetOption,
} from "@/components/ui/facet-filter"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
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
const ALL_OWNERS_VALUE = "__all_owners__"

type SearchFilters = {
  meeting: string
  notes: string
}

type FacetFilters = {
  person: string[]
  client: string[]
  purpose: string[]
  cadence: string[]
}

const columns: ColumnDef<MeetingRecord>[] = [
  {
    accessorKey: "meeting_name",
    header: ({ column }) => (
      <SortHeader column={column} title="Meeting" className="w-[16%] min-w-[13rem]" />
    ),
    cell: ({ row }) => {
      const meeting = row.original

      return (
        <div className="grid gap-1 whitespace-normal">
          <p className="font-medium text-foreground">{meeting.meeting_name}</p>
          <p className="text-xs text-muted-foreground">
            {meeting.time} / {meeting.timeBucketLabel}
          </p>
        </div>
      )
    },
  },
  {
    accessorKey: "owner_name",
    header: ({ column }) => (
      <SortHeader column={column} title="Owner" className="w-[10rem]" />
    ),
    cell: ({ row }) => <span className="whitespace-normal">{row.original.owner_name}</span>,
  },
  {
    id: "attendees",
    accessorFn: (row) => row.attendeeCount,
    header: ({ column }) => (
      <SortHeader column={column} title="Attendees" className="w-[8rem]" />
    ),
    cell: ({ row }) => <AttendeesCell meeting={row.original} />,
  },
  {
    accessorKey: "primary_purpose",
    header: ({ column }) => (
      <SortHeader column={column} title="Purpose" className="w-[15%] min-w-[12rem]" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[15rem] whitespace-normal">
        {row.original.primary_purpose || (
          <span className="text-sm text-muted-foreground">No purpose</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "cadence",
    header: ({ column }) => (
      <SortHeader column={column} title="Cadence" className="w-[14%] min-w-[11rem]" />
    ),
    cell: ({ row }) => {
      const meeting = row.original

      return (
        <div className="grid gap-1 whitespace-normal">
          <Badge variant="secondary" className="w-fit rounded-full">
            {meeting.cadence}
          </Badge>
          <p className="text-xs text-muted-foreground">
            {meeting.weekdays.length ? meeting.weekdays.join(", ") : "No weekday provided"}
            {meeting.biweeklyWeek ? ` · ${meeting.biweeklyWeek}` : ""}
          </p>
        </div>
      )
    },
  },
  {
    accessorKey: "clientLabel",
    header: ({ column }) => (
      <SortHeader column={column} title="Client" className="w-[9rem]" />
    ),
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
    header: ({ column }) => (
      <SortHeader column={column} title="Notes" className="w-[22%] min-w-[18rem]" />
    ),
    cell: ({ row }) => {
      const notes = row.original.dataNotes

      if (!notes.length) {
        return <span className="text-sm text-muted-foreground">No notes</span>
      }

      return (
        <div className="grid w-full min-w-0 max-w-full gap-1">
          {notes.map((note) => (
            <p key={note} className="min-w-0 text-xs leading-5 text-muted-foreground whitespace-normal break-words">
              {note}
            </p>
          ))}
        </div>
      )
    },
  },
  {
    accessorKey: "weeklyWeightedAttendeeMinutes",
    header: ({ column }) => (
      <SortHeader column={column} title="Weekly load" className="w-[9rem] justify-end" />
    ),
    cell: ({ row }) => {
      const meeting = row.original

      return (
        <div className="grid gap-1 text-right whitespace-normal">
          <p className="font-mono text-sm font-medium tabular-nums">
            {formatMetricMinutes(meeting.weeklyWeightedAttendeeMinutes)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatWeeklyLoadFormula(meeting)}
          </p>
        </div>
      )
    },
  },
]

function normalizeFilterValue(value: string) {
  return value.trim().toLowerCase()
}

function getAttendeeFilterValues(meeting: MeetingRecord) {
  return [
    ...new Set(
      meeting.attendeeList.map((attendee) => normalizeFilterValue(attendee)).filter(Boolean)
    ),
  ]
}

function meetingIncludesSelectedPerson(meeting: MeetingRecord, selectedPeople: string[]) {
  if (!selectedPeople.length) {
    return true
  }

  const attendeeValues = new Set(getAttendeeFilterValues(meeting))
  return selectedPeople.some((person) => attendeeValues.has(person))
}

function formatWeeklyLoadFormula(meeting: MeetingRecord) {
  const parts = [
    `${meeting.durationMinutes} min`,
    meeting.attendeeCount.toString(),
    meeting.cadenceFactor.toString(),
  ]

  if (meeting.weeklyOccurrenceCount > 1) {
    parts.push(`${meeting.weeklyOccurrenceCount} days`)
  }

  return parts.join(" x ")
}

function buildFacetOptions(values: string[]): FacetOption[] {
  const optionsByValue = new Map<string, string>()

  for (const value of values) {
    const trimmed = value.trim()
    if (!trimmed) {
      continue
    }

    const normalized = normalizeFilterValue(trimmed)
    if (!optionsByValue.has(normalized)) {
      optionsByValue.set(normalized, trimmed)
    }
  }

  return Array.from(optionsByValue.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((left, right) => left.label.localeCompare(right.label))
}

function toggleFilterValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((existingValue) => existingValue !== value)
    : [...values, value]
}

export function MeetingDirectoryDataTable({ meetings }: { meetings: MeetingRecord[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "weeklyWeightedAttendeeMinutes", desc: true },
  ])
  const [searchFilters, setSearchFilters] = React.useState<SearchFilters>({
    meeting: "",
    notes: "",
  })
  const [ownerFilter, setOwnerFilter] = React.useState(ALL_OWNERS_VALUE)
  const [facetFilters, setFacetFilters] = React.useState<FacetFilters>({
    person: [],
    client: [],
    purpose: [],
    cadence: [],
  })

  const ownerOptions = React.useMemo(
    () => buildFacetOptions(meetings.map((meeting) => meeting.owner_name)),
    [meetings]
  )
  const personOptions = React.useMemo(
    () => buildFacetOptions(meetings.flatMap((meeting) => meeting.attendeeList)),
    [meetings]
  )
  const clientOptions = React.useMemo(
    () => buildFacetOptions(meetings.map((meeting) => meeting.clientLabel)),
    [meetings]
  )
  const purposeOptions = React.useMemo(
    () => buildFacetOptions(meetings.map((meeting) => meeting.primary_purpose)),
    [meetings]
  )
  const cadenceOptions = React.useMemo(
    () => buildFacetOptions(meetings.map((meeting) => meeting.cadence)),
    [meetings]
  )

  const matchesFilters = React.useCallback(
    (meeting: MeetingRecord, omittedFacet?: keyof FacetFilters) => {
      const meetingQuery = searchFilters.meeting.trim().toLowerCase()
      if (
        meetingQuery &&
        !`${meeting.meeting_name} ${meeting.time} ${meeting.timeBucketLabel}`
          .toLowerCase()
          .includes(meetingQuery)
      ) {
        return false
      }

      if (
        ownerFilter !== ALL_OWNERS_VALUE &&
        normalizeFilterValue(meeting.owner_name) !== ownerFilter
      ) {
        return false
      }

      const notesQuery = searchFilters.notes.trim().toLowerCase()
      if (
        notesQuery &&
        !meeting.dataNotes.join(" ").toLowerCase().includes(notesQuery)
      ) {
        return false
      }

      if (
        omittedFacet !== "person" &&
        facetFilters.person.length > 0 &&
        !meetingIncludesSelectedPerson(meeting, facetFilters.person)
      ) {
        return false
      }

      if (
        omittedFacet !== "client" &&
        facetFilters.client.length > 0 &&
        !facetFilters.client.includes(normalizeFilterValue(meeting.clientLabel))
      ) {
        return false
      }

      if (
        omittedFacet !== "purpose" &&
        facetFilters.purpose.length > 0 &&
        !facetFilters.purpose.includes(normalizeFilterValue(meeting.primary_purpose))
      ) {
        return false
      }

      if (
        omittedFacet !== "cadence" &&
        facetFilters.cadence.length > 0 &&
        !facetFilters.cadence.includes(normalizeFilterValue(meeting.cadence))
      ) {
        return false
      }

      return true
    },
    [facetFilters, ownerFilter, searchFilters]
  )

  const filteredMeetings = React.useMemo(
    () => meetings.filter((meeting) => matchesFilters(meeting)),
    [matchesFilters, meetings]
  )

  const facetCounts = React.useMemo(() => {
    const countByFacet = (facet: keyof FacetFilters) => {
      const counts = new Map<string, number>()

      for (const meeting of meetings) {
        if (!matchesFilters(meeting, facet)) {
          continue
        }

        const values =
          facet === "person"
            ? getAttendeeFilterValues(meeting)
            : [
                facet === "client"
                  ? normalizeFilterValue(meeting.clientLabel)
                  : facet === "purpose"
                    ? normalizeFilterValue(meeting.primary_purpose)
                    : normalizeFilterValue(meeting.cadence),
              ]

        for (const value of values) {
          if (!value) {
            continue
          }

          counts.set(value, (counts.get(value) ?? 0) + 1)
        }
      }

      return counts
    }

    return {
      person: countByFacet("person"),
      client: countByFacet("client"),
      purpose: countByFacet("purpose"),
      cadence: countByFacet("cadence"),
    }
  }, [matchesFilters, meetings])

  const hasActiveFacetFilters =
    facetFilters.person.length > 0 ||
    facetFilters.client.length > 0 ||
    facetFilters.purpose.length > 0 ||
    facetFilters.cadence.length > 0
  const hasSearchFilters =
    searchFilters.meeting.trim().length > 0 ||
    searchFilters.notes.trim().length > 0
  const hasOwnerFilter = ownerFilter !== ALL_OWNERS_VALUE
  const hasAnyFilters = hasActiveFacetFilters || hasSearchFilters || hasOwnerFilter

  const clearFilters = () => {
    setSearchFilters({
      meeting: "",
      notes: "",
    })
    setOwnerFilter(ALL_OWNERS_VALUE)
    setFacetFilters({
      person: [],
      client: [],
      purpose: [],
      cadence: [],
    })
  }

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table manages its own imperative table API.
  const table = useReactTable({
    data: filteredMeetings,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
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
  const filteredCount = filteredMeetings.length
  const startRow = filteredCount === 0 ? 0 : pageIndex * pageSize + 1
  const endRow = Math.min((pageIndex + 1) * pageSize, filteredCount)

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <div>
          {filteredCount.toLocaleString()} of {meetings.length.toLocaleString()} meetings
        </div>
      </div>

      <div className="grid gap-3 rounded-[1rem] border border-border/70 bg-background/35 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <DirectorySearchField
            value={searchFilters.meeting}
            onChange={(value) =>
              setSearchFilters((current) => ({ ...current, meeting: value }))
            }
            placeholder="Search meeting..."
          />
          <DirectoryOwnerSelect
            value={ownerFilter}
            options={ownerOptions}
            onValueChange={setOwnerFilter}
          />
          <DirectorySearchField
            value={searchFilters.notes}
            onChange={(value) =>
              setSearchFilters((current) => ({ ...current, notes: value }))
            }
            placeholder="Search notes..."
          />
          <FacetFilter
            label="Person"
            options={personOptions}
            selectedValues={facetFilters.person}
            counts={facetCounts.person}
            onToggleValue={(value) =>
              setFacetFilters((current) => ({
                ...current,
                person: toggleFilterValue(current.person, value),
              }))
            }
          />
          <FacetFilter
            label="Client"
            options={clientOptions}
            selectedValues={facetFilters.client}
            counts={facetCounts.client}
            onToggleValue={(value) =>
              setFacetFilters((current) => ({
                ...current,
                client: toggleFilterValue(current.client, value),
              }))
            }
          />
          <FacetFilter
            label="Purpose"
            options={purposeOptions}
            selectedValues={facetFilters.purpose}
            counts={facetCounts.purpose}
            onToggleValue={(value) =>
              setFacetFilters((current) => ({
                ...current,
                purpose: toggleFilterValue(current.purpose, value),
              }))
            }
          />
          <FacetFilter
            label="Cadence"
            options={cadenceOptions}
            selectedValues={facetFilters.cadence}
            counts={facetCounts.cadence}
            onToggleValue={(value) =>
              setFacetFilters((current) => ({
                ...current,
                cadence: toggleFilterValue(current.cadence, value),
              }))
            }
          />
          <Button
            type="button"
            variant="outline"
            className="ml-auto h-9 rounded-xl px-3"
            disabled={!hasAnyFilters}
            onClick={clearFilters}
          >
            Clear
          </Button>
        </div>

        {hasActiveFacetFilters ? (
          <div className="flex flex-wrap gap-2">
            <ActiveFacetChips
              facetLabel="Person"
              options={personOptions}
              selectedValues={facetFilters.person}
              onRemoveValue={(value) =>
                setFacetFilters((current) => ({
                  ...current,
                  person: current.person.filter((currentValue) => currentValue !== value),
                }))
              }
            />
            <ActiveFacetChips
              facetLabel="Client"
              options={clientOptions}
              selectedValues={facetFilters.client}
              onRemoveValue={(value) =>
                setFacetFilters((current) => ({
                  ...current,
                  client: current.client.filter((currentValue) => currentValue !== value),
                }))
              }
            />
            <ActiveFacetChips
              facetLabel="Purpose"
              options={purposeOptions}
              selectedValues={facetFilters.purpose}
              onRemoveValue={(value) =>
                setFacetFilters((current) => ({
                  ...current,
                  purpose: current.purpose.filter((currentValue) => currentValue !== value),
                }))
              }
            />
            <ActiveFacetChips
              facetLabel="Cadence"
              options={cadenceOptions}
              selectedValues={facetFilters.cadence}
              onRemoveValue={(value) =>
                setFacetFilters((current) => ({
                  ...current,
                  cadence: current.cadence.filter((currentValue) => currentValue !== value),
                }))
              }
            />
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-[1rem] border border-border/70 bg-background/15">
        <Table className="min-w-[1280px] table-fixed [&_td]:align-top">
          <TableHeader className="bg-background/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-11 border-b border-border/70">
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
                <TableRow
                  key={row.id}
                  className="border-b border-border/60 bg-transparent hover:bg-background/40"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "py-3.5 overflow-hidden",
                        cell.column.id === "attendees" && "w-[8rem]",
                        cell.column.id === "notes" && "max-w-0",
                        cell.column.id === "weeklyWeightedAttendeeMinutes" && "w-[9rem]"
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={table.getVisibleLeafColumns().length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No meetings match the current filters.
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
                className="rounded-lg"
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
              className="rounded-lg"
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
              className="rounded-lg"
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

function AttendeesCell({ meeting }: { meeting: MeetingRecord }) {
  const attendeeLabel =
    meeting.attendeeCount === 1 ? "1 attendee" : `${meeting.attendeeCount} attendees`

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-lg border-border/70 bg-background/80 px-2.5 font-mono tabular-nums shadow-none"
            aria-label={`View ${attendeeLabel} for ${meeting.meeting_name}`}
          >
            <UsersIcon className="size-3.5 text-muted-foreground" />
            <span>{meeting.attendeeCount}</span>
          </Button>
        }
      />
      <PopoverContent align="start" className="w-80 rounded-xl">
        <PopoverHeader>
          <PopoverTitle className="text-sm">{attendeeLabel}</PopoverTitle>
          <PopoverDescription className="text-xs">
            {meeting.meeting_name}
          </PopoverDescription>
        </PopoverHeader>
        {meeting.attendeeList.length ? (
          <div className="grid max-h-72 gap-1 overflow-y-auto pr-1">
            {meeting.attendeeList.map((attendee, index) => (
              <div
                key={`${meeting.meeting_name}-${attendee}-${index}`}
                className="rounded-lg border border-border/60 bg-background/60 px-2.5 py-1.5 text-sm text-foreground"
              >
                {attendee}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No attendees listed.</p>
        )}
      </PopoverContent>
    </Popover>
  )
}

function DirectoryOwnerSelect({
  value,
  options,
  onValueChange,
}: {
  value: string
  options: FacetOption[]
  onValueChange: (value: string) => void
}) {
  const selectedLabel =
    value === ALL_OWNERS_VALUE
      ? "All owners"
      : options.find((option) => option.value === value)?.label ?? "All owners"

  return (
    <Select
      value={value}
      onValueChange={(nextValue) => {
        if (nextValue) {
          onValueChange(nextValue)
        }
      }}
    >
      <SelectTrigger
        aria-label="Filter by owner"
        className="h-9 min-w-[13rem] rounded-lg border-border/70 bg-background/90 px-3 shadow-none sm:w-[14rem]"
      >
        <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <UserRoundIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{selectedLabel}</span>
        </span>
      </SelectTrigger>
      <SelectContent align="start" className="max-h-80 rounded-xl">
        <SelectItem value={ALL_OWNERS_VALUE}>All owners</SelectItem>
        {options.map((option) => (
          <SelectItem key={`owner-${option.value}`} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function DirectorySearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <Input
      value={value}
      onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-9 min-w-[13rem] rounded-lg border-border/70 bg-background/90 px-3 shadow-none sm:w-[14rem]"
    />
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
