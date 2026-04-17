"use client"

import type { ReactNode } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Building2Icon,
  CheckIcon,
  GitBranchIcon,
  PaletteIcon,
  PlusIcon,
  RotateCcwIcon,
  SaveIcon,
  TagIcon,
  Trash2Icon,
  User2Icon,
  XIcon,
} from "lucide-react"

import { OPEN_PROPOSAL_MEETING_EDITOR_EVENT } from "@/components/schedule/events"
import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxCreateNew,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox"
import type { FacetOption } from "@/components/ui/facet-filter"
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import {
  formatDurationMinutes,
  formatMinutesToTime,
  formatRecurrence,
  parseDurationMinutes,
  parseRecurrence,
  parseTimeToMinutes,
} from "@/lib/schedule-utils"
import type { DashboardEntityColors } from "@/types/dashboard"
import { WEEKDAYS, type Weekday } from "@/types/report"
import type {
  BaselineDecisionType,
  ReplacementLink,
  ScenarioMeetingRow,
} from "@/types/planning"

const WEEK_COLUMNS = [
  { week: 1, weekday: "Monday" as Weekday, label: "Mon W1" },
  { week: 1, weekday: "Tuesday" as Weekday, label: "Tue W1" },
  { week: 1, weekday: "Wednesday" as Weekday, label: "Wed W1" },
  { week: 1, weekday: "Thursday" as Weekday, label: "Thu W1" },
  { week: 1, weekday: "Friday" as Weekday, label: "Fri W1" },
  { week: 2, weekday: "Monday" as Weekday, label: "Mon W2" },
  { week: 2, weekday: "Tuesday" as Weekday, label: "Tue W2" },
  { week: 2, weekday: "Wednesday" as Weekday, label: "Wed W2" },
  { week: 2, weekday: "Thursday" as Weekday, label: "Thu W2" },
  { week: 2, weekday: "Friday" as Weekday, label: "Fri W2" },
] as const

const START_MINUTES = 7 * 60
const END_MINUTES = 19 * 60
const TOTAL_MINUTES = END_MINUTES - START_MINUTES
const GRID_HEIGHT_PX = 720
const ALL_FILTER_VALUE = "__all__"
const NO_CLIENT_FILTER_VALUE = "__no_client__"
const PURPOSE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "color-mix(in oklch, var(--chart-1) 55%, var(--chart-2) 45%)",
  "color-mix(in oklch, var(--chart-4) 70%, var(--chart-2) 30%)",
] as const
const DEFAULT_CLIENT_COLORS = [
  "#4f7cff",
  "#e59a3b",
  "#2bb6a3",
  "#c96bdb",
  "#7d8aa3",
  "#e36f5d",
] as const
const DEFAULT_PERSON_COLORS = [
  "#e36f5d",
  "#d2a02e",
  "#4f7cff",
  "#b76bd6",
  "#3fb69a",
  "#f08c3c",
  "#49bca8",
  "#c9872a",
  "#5bb0ff",
  "#d169c7",
  "#8f9ae6",
] as const
const ACTION_FILTER_OPTIONS: FacetOption[] = [
  { value: "continue", label: "Continue" },
  { value: "cancel", label: "Cancel" },
  { value: "change", label: "Change" },
]
const COLOR_MODE_OPTIONS = [
  { value: "action", label: "Scenario action" },
  { value: "client", label: "Client" },
  { value: "purpose", label: "Type" },
  { value: "owner", label: "Owner" },
] as const

type MeetingDraft = {
  id?: number
  rowOrder?: number
  sourceMeetingId: number | null
  submissionDate: string
  sourceExcelRow: string
  ownerName: string
  meetingName: string
  startMinutes: number
  durationMinutes: number
  cadence: "Weekly" | "Biweekly" | "Monthly"
  weekdays: Weekday[]
  primaryPurpose: string
  attendees: string
  clientIfApplicable: string
  notes: string
  baselineMeetingIds: number[]
}

type ScheduleFilterValue = string
type ScheduleActionFilterValue = BaselineDecisionType | typeof ALL_FILTER_VALUE

type ScheduleFilters = {
  person: ScheduleFilterValue
  client: ScheduleFilterValue
  purpose: ScheduleFilterValue
  action: ScheduleActionFilterValue
}

type ScheduleColorMode = (typeof COLOR_MODE_OPTIONS)[number]["value"]

type FilterableMeeting = {
  kind: "baseline" | "proposal"
  meeting: ScenarioMeetingRow
  actionValues: BaselineDecisionType[]
}

type ScheduleBuilderProps = {
  activeScenarioId: number | null
  baselineScenarioId: number | null
  baselineMeetings: ScenarioMeetingRow[]
  proposalMeetings: ScenarioMeetingRow[]
  entityColors: DashboardEntityColors
  replacementLinks: ReplacementLink[]
  decisionByBaselineId: Map<number, BaselineDecisionType>
  onSetDecision: (baselineMeetingId: number, decision: BaselineDecisionType) => Promise<void>
  onSaveMeeting: (input: {
    id?: number
    rowOrder?: number
    sourceMeetingId?: number | null
    submissionDate: string
    ownerName: string
    meetingName: string
    time: string
    frequency: string
    duration: string
    primaryPurpose: string
    attendees: string
    clientIfApplicable: string
    notes: string
    sourceExcelRow: string
    baselineMeetingIds: number[]
  }) => Promise<number>
  onDeleteMeeting: (meetingId: number) => Promise<void>
  onRestoreBaselineSchedule: () => Promise<void>
}

function getMeetingDraft(meeting: ScenarioMeetingRow, linkedBaselineIds: number[]): MeetingDraft {
  const recurrence = parseRecurrence(meeting.frequency)

  return {
    id: meeting.id,
    rowOrder: meeting.rowOrder,
    sourceMeetingId: meeting.sourceMeetingId,
    submissionDate: meeting.submission_date,
    sourceExcelRow: meeting.source_excel_row,
    ownerName: meeting.owner_name,
    meetingName: meeting.meeting_name,
    startMinutes: parseTimeToMinutes(meeting.time),
    durationMinutes: parseDurationMinutes(meeting.duration),
    cadence: recurrence.cadence,
    weekdays: recurrence.weekdays,
    primaryPurpose: meeting.primary_purpose,
    attendees: meeting.attendees,
    clientIfApplicable: meeting.client_if_applicable,
    notes: meeting.notes,
    baselineMeetingIds: linkedBaselineIds,
  }
}

function createEmptyDraft(baselineMeetingIds: number[] = []): MeetingDraft {
  return {
    sourceMeetingId: null,
    submissionDate: formatSubmissionDate(),
    sourceExcelRow: "schedule-builder",
    ownerName: "",
    meetingName: "",
    startMinutes: 9 * 60,
    durationMinutes: 30,
    cadence: "Weekly",
    weekdays: ["Monday"],
    primaryPurpose: "Planning",
    attendees: "",
    clientIfApplicable: "",
    notes: "",
    baselineMeetingIds,
  }
}

function formatSubmissionDate() {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date())
}

function normalizeFilterValue(value: string) {
  return value.trim().toLowerCase()
}

function buildFilterOptions(values: string[]): FacetOption[] {
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
    .sort((a, b) => a.label.localeCompare(b.label))
}

function parseAttendeeList(attendees: string) {
  const valuesByNormalized = new Map<string, string>()

  for (const part of attendees.split(";")) {
    const label = part.trim()
    if (!label) {
      continue
    }

    const normalized = normalizeFilterValue(label)
    if (!valuesByNormalized.has(normalized)) {
      valuesByNormalized.set(normalized, label)
    }
  }

  return Array.from(valuesByNormalized.values())
}

function formatAttendeeList(attendees: string[]) {
  return attendees.join("; ")
}

function parseClientLabel(value: string) {
  return value.trim() || "Internal"
}

function getFallbackColor(label: string, palette: readonly string[]) {
  const seed = Array.from(label).reduce((total, char) => total + char.charCodeAt(0), 0)
  return palette[seed % palette.length]
}

function getClientColor(entityColors: DashboardEntityColors, client: string) {
  return (
    entityColors.clients[client] ??
    getFallbackColor(client, DEFAULT_CLIENT_COLORS)
  )
}

function getOwnerColor(entityColors: DashboardEntityColors, owner: string) {
  const trimmedOwner = owner.trim()
  const [firstName = "", ...rest] = trimmedOwner.split(/\s+/)
  const lastName = rest.at(-1) ?? ""

  return (
    entityColors.people[trimmedOwner] ??
    entityColors.people[firstName] ??
    entityColors.people[lastName] ??
    getFallbackColor(trimmedOwner, DEFAULT_PERSON_COLORS)
  )
}

function getToneBorderColor(tone: BaselineDecisionType | "proposal") {
  if (tone === "cancel") {
    return "color-mix(in oklch, var(--destructive) 55%, transparent)"
  }
  if (tone === "change") {
    return "color-mix(in oklch, var(--warning) 70%, transparent)"
  }
  if (tone === "proposal") {
    return "color-mix(in oklch, var(--primary) 70%, transparent)"
  }

  return "color-mix(in oklch, var(--muted-foreground) 55%, transparent)"
}

function getBlockBackgroundColor({
  colorMode,
  entityColors,
  clientLabel,
  ownerName,
  purpose,
  purposeColorMap,
  tone,
}: {
  colorMode: ScheduleColorMode
  entityColors: DashboardEntityColors
  clientLabel: string
  ownerName: string
  purpose: string
  purposeColorMap: Map<string, string>
  tone: BaselineDecisionType | "proposal"
}) {
  if (colorMode === "action") {
    if (tone === "cancel") {
      return "color-mix(in oklch, var(--destructive) 18%, var(--surface-panel))"
    }
    if (tone === "change") {
      return "color-mix(in oklch, var(--warning) 22%, var(--surface-panel))"
    }
    if (tone === "proposal") {
      return "color-mix(in oklch, var(--primary) 24%, var(--surface-panel))"
    }

    return "color-mix(in oklch, var(--surface-strong) 64%, var(--surface-panel))"
  }

  const sourceColor =
    colorMode === "client"
      ? getClientColor(entityColors, clientLabel)
      : colorMode === "owner"
        ? getOwnerColor(entityColors, ownerName)
        : purposeColorMap.get(purpose) ?? getFallbackColor(purpose || "type", PURPOSE_COLORS)

  return `color-mix(in oklch, ${sourceColor} 32%, var(--surface-panel))`
}

function getBlockTextColor(tone: BaselineDecisionType | "proposal") {
  if (tone === "cancel") {
    return "color-mix(in oklch, var(--foreground) 72%, var(--background))"
  }

  return "var(--foreground)"
}

function getBlockDetailColor(tone: BaselineDecisionType | "proposal") {
  if (tone === "cancel") {
    return "color-mix(in oklch, var(--foreground) 58%, var(--background))"
  }

  return "color-mix(in oklch, var(--foreground) 84%, var(--background))"
}

function getBlockMetaColor(tone: BaselineDecisionType | "proposal") {
  if (tone === "cancel") {
    return "color-mix(in oklch, var(--foreground) 50%, var(--background))"
  }

  return "color-mix(in oklch, var(--foreground) 68%, var(--background))"
}

export function ScheduleBuilder({
  activeScenarioId,
  baselineScenarioId,
  baselineMeetings,
  proposalMeetings,
  entityColors,
  replacementLinks,
  decisionByBaselineId,
  onSetDecision,
  onSaveMeeting,
  onDeleteMeeting,
  onRestoreBaselineSchedule,
}: ScheduleBuilderProps) {
  const [selectedBaselineId, setSelectedBaselineId] = useState<number | null>(null)
  const [selectedBaselineBlockKey, setSelectedBaselineBlockKey] = useState<string | null>(null)
  const [draft, setDraft] = useState<MeetingDraft>(createEmptyDraft())
  const [filters, setFilters] = useState<ScheduleFilters>({
    person: ALL_FILTER_VALUE,
    client: ALL_FILTER_VALUE,
    purpose: ALL_FILTER_VALUE,
    action: ALL_FILTER_VALUE,
  })
  const [meetingSheetOpen, setMeetingSheetOpen] = useState(false)
  const [attendeeSelectionValue, setAttendeeSelectionValue] = useState("")
  const [saving, setSaving] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [colorMode, setColorMode] = useState<ScheduleColorMode>("action")

  const proposalById = useMemo(
    () => new Map(proposalMeetings.map((meeting) => [meeting.id, meeting])),
    [proposalMeetings]
  )
  const baselineById = useMemo(
    () => new Map(baselineMeetings.map((meeting) => [meeting.id, meeting])),
    [baselineMeetings]
  )
  const linksByProposalId = useMemo(() => {
    const map = new Map<number, number[]>()
    for (const link of replacementLinks) {
      const current = map.get(link.proposalMeetingId) ?? []
      current.push(link.baselineMeetingId)
      map.set(link.proposalMeetingId, current)
    }
    return map
  }, [replacementLinks])

  const linksByBaselineId = useMemo(() => {
    const map = new Map<number, number[]>()
    for (const link of replacementLinks) {
      const current = map.get(link.baselineMeetingId) ?? []
      current.push(link.proposalMeetingId)
      map.set(link.baselineMeetingId, current)
    }
    return map
  }, [replacementLinks])

  const allMeetingsForFilters = useMemo(
    () => [...baselineMeetings, ...proposalMeetings],
    [baselineMeetings, proposalMeetings]
  )

  const personFilterOptions = useMemo(
    () => buildFilterOptions(allMeetingsForFilters.map((meeting) => meeting.owner_name)),
    [allMeetingsForFilters]
  )
  const purposeFilterOptions = useMemo(
    () => buildFilterOptions(allMeetingsForFilters.map((meeting) => meeting.primary_purpose)),
    [allMeetingsForFilters]
  )
  const clientFilterOptions = useMemo(() => {
    const options = buildFilterOptions(
      allMeetingsForFilters.map((meeting) => meeting.client_if_applicable)
    )
    const hasNoClient = allMeetingsForFilters.some(
      (meeting) => normalizeFilterValue(meeting.client_if_applicable) === ""
    )
    return hasNoClient
      ? [{ value: NO_CLIENT_FILTER_VALUE, label: "No client" }, ...options]
      : options
  }, [allMeetingsForFilters])

  const baselineFilterableMeetings = useMemo<FilterableMeeting[]>(
    () =>
      baselineMeetings.map((meeting) => ({
        kind: "baseline",
        meeting,
        actionValues: [decisionByBaselineId.get(meeting.id) ?? "continue"],
      })),
    [baselineMeetings, decisionByBaselineId]
  )
  const proposalFilterableMeetings = useMemo<FilterableMeeting[]>(
    () =>
      proposalMeetings.map((meeting) => ({
        kind: "proposal",
        meeting,
        actionValues: Array.from(
          new Set(
            (linksByProposalId.get(meeting.id) ?? []).map(
              (baselineId) => decisionByBaselineId.get(baselineId) ?? "continue"
            )
          )
        ),
      })),
    [decisionByBaselineId, linksByProposalId, proposalMeetings]
  )
  const allFilterableMeetings = useMemo(
    () => [...baselineFilterableMeetings, ...proposalFilterableMeetings],
    [baselineFilterableMeetings, proposalFilterableMeetings]
  )

  const matchesFilters = useCallback(
    (record: FilterableMeeting, omittedFacet?: keyof ScheduleFilters) => {
      if (
        omittedFacet !== "person" &&
        filters.person !== ALL_FILTER_VALUE &&
        filters.person !== normalizeFilterValue(record.meeting.owner_name)
      ) {
        return false
      }

      if (omittedFacet !== "client" && filters.client !== ALL_FILTER_VALUE) {
        const normalizedClient =
          normalizeFilterValue(record.meeting.client_if_applicable) || NO_CLIENT_FILTER_VALUE
        if (filters.client !== normalizedClient) {
          return false
        }
      }

      if (
        omittedFacet !== "purpose" &&
        filters.purpose !== ALL_FILTER_VALUE &&
        filters.purpose !== normalizeFilterValue(record.meeting.primary_purpose)
      ) {
        return false
      }

      if (
        omittedFacet !== "action" &&
        filters.action !== ALL_FILTER_VALUE &&
        !record.actionValues.includes(filters.action as BaselineDecisionType)
      ) {
        return false
      }

      return true
    },
    [filters]
  )

  const filteredBaselineMeetings = useMemo(
    () =>
      baselineFilterableMeetings
        .filter((meeting) => matchesFilters(meeting))
        .map((meeting) => meeting.meeting),
    [baselineFilterableMeetings, matchesFilters]
  )
  const filteredProposalMeetings = useMemo(
    () =>
      proposalFilterableMeetings
        .filter((meeting) => matchesFilters(meeting))
        .map((meeting) => meeting.meeting),
    [matchesFilters, proposalFilterableMeetings]
  )
  const facetCounts = useMemo(() => {
    const countByFacet = (facet: keyof ScheduleFilters) => {
      const counts = new Map<string, number>()

      for (const record of allFilterableMeetings) {
        if (!matchesFilters(record, facet)) {
          continue
        }

        const values =
          facet === "person"
            ? [normalizeFilterValue(record.meeting.owner_name)]
            : facet === "client"
              ? [normalizeFilterValue(record.meeting.client_if_applicable) || NO_CLIENT_FILTER_VALUE]
              : facet === "purpose"
                ? [normalizeFilterValue(record.meeting.primary_purpose)]
                : record.actionValues

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
      action: countByFacet("action"),
    }
  }, [allFilterableMeetings, matchesFilters])
  const replaceableBaselineMeetings = useMemo(
    () =>
      filteredBaselineMeetings.filter(
        (meeting) => (decisionByBaselineId.get(meeting.id) ?? "continue") === "change"
      ),
    [decisionByBaselineId, filteredBaselineMeetings]
  )
  const attendeeOptions = useMemo(() => {
    const optionsByValue = new Map<string, string>()

    for (const meeting of allMeetingsForFilters) {
      for (const attendee of parseAttendeeList(meeting.attendees)) {
        const normalized = normalizeFilterValue(attendee)
        if (!optionsByValue.has(normalized)) {
          optionsByValue.set(normalized, attendee)
        }
      }
    }

    return Array.from(optionsByValue.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [allMeetingsForFilters])
  const attendeeLabelByValue = useMemo(
    () => new Map(attendeeOptions.map((option) => [option.value, option.label])),
    [attendeeOptions]
  )
  const purposeColorMap = useMemo(() => {
    const labels = [...new Set(allMeetingsForFilters.map((meeting) => meeting.primary_purpose.trim()).filter(Boolean))]
      .sort((left, right) => left.localeCompare(right))

    return new Map(
      labels.map((label, index) => [label, PURPOSE_COLORS[index % PURPOSE_COLORS.length]])
    )
  }, [allMeetingsForFilters])
  const selectedAttendees = useMemo(() => parseAttendeeList(draft.attendees), [draft.attendees])
  const selectedAttendeeValueSet = useMemo(
    () => new Set(selectedAttendees.map((attendee) => normalizeFilterValue(attendee))),
    [selectedAttendees]
  )

  const scheduleBlocks = useMemo(() => {
    type PositionedMeetingBlock = {
      key: string
      colIndex: number
      topPx: number
      heightPx: number
      title: string
      detail: string
      tone: "continue" | "cancel" | "change" | "proposal"
      kind: "baseline" | "proposal"
      meetingId: number
      clientLabel: string
      ownerName: string
      purpose: string
      lane: number
      laneCount: number
      startOffset: number
      endOffset: number
    }

    const blocks: Array<{
      key: string
      colIndex: number
      topPx: number
      heightPx: number
      title: string
      detail: string
      tone: "continue" | "cancel" | "change" | "proposal"
      kind: "baseline" | "proposal"
      meetingId: number
      clientLabel: string
      ownerName: string
      purpose: string
      startOffset: number
      endOffset: number
    }> = []

    for (const meeting of filteredBaselineMeetings) {
      const recurrence = parseRecurrence(meeting.frequency)
      if (recurrence.weekdays.length === 0) {
        continue
      }

      const startMinutes = parseTimeToMinutes(meeting.time)
      const durationMinutes = parseDurationMinutes(meeting.duration)
      const startOffset = Math.max(0, Math.min(TOTAL_MINUTES, startMinutes - START_MINUTES))
      const endOffset = Math.min(TOTAL_MINUTES, startOffset + durationMinutes)
      const topPx = (startOffset / TOTAL_MINUTES) * GRID_HEIGHT_PX
      const heightPx = Math.max(18, ((endOffset - startOffset) / TOTAL_MINUTES) * GRID_HEIGHT_PX)
      const tone = decisionByBaselineId.get(meeting.id) ?? "continue"

      for (const weekday of recurrence.weekdays) {
        const dayIndexes = WEEK_COLUMNS.flatMap((column, index) =>
          column.weekday === weekday ? [index] : []
        )

        for (const colIndex of dayIndexes) {
          blocks.push({
            key: `${meeting.id}-${colIndex}`,
            colIndex,
            topPx,
            heightPx,
            title: meeting.meeting_name,
            detail: `${meeting.owner_name} | ${meeting.time}`,
            tone,
            kind: "baseline",
            meetingId: meeting.id,
            clientLabel: parseClientLabel(meeting.client_if_applicable),
            ownerName: meeting.owner_name,
            purpose: meeting.primary_purpose,
            startOffset,
            endOffset,
          })
        }
      }
    }

    for (const meeting of filteredProposalMeetings) {
      const recurrence = parseRecurrence(meeting.frequency)
      if (recurrence.weekdays.length === 0) {
        continue
      }

      const startMinutes = parseTimeToMinutes(meeting.time)
      const durationMinutes = parseDurationMinutes(meeting.duration)
      const startOffset = Math.max(0, Math.min(TOTAL_MINUTES, startMinutes - START_MINUTES))
      const endOffset = Math.min(TOTAL_MINUTES, startOffset + durationMinutes)
      const topPx = (startOffset / TOTAL_MINUTES) * GRID_HEIGHT_PX
      const heightPx = Math.max(18, ((endOffset - startOffset) / TOTAL_MINUTES) * GRID_HEIGHT_PX)

      for (const weekday of recurrence.weekdays) {
        const dayIndexes = WEEK_COLUMNS.flatMap((column, index) =>
          column.weekday === weekday ? [index] : []
        )

        for (const colIndex of dayIndexes) {
          blocks.push({
            key: `proposal-${meeting.id}-${colIndex}`,
            colIndex,
            topPx,
            heightPx,
            title: meeting.meeting_name,
            detail: `${meeting.owner_name} | ${meeting.time}`,
            tone: "proposal",
            kind: "proposal",
            meetingId: meeting.id,
            clientLabel: parseClientLabel(meeting.client_if_applicable),
            ownerName: meeting.owner_name,
            purpose: meeting.primary_purpose,
            startOffset,
            endOffset,
          })
        }
      }
    }

    const blocksByColumn = new Map<number, typeof blocks>()
    for (const block of blocks) {
      const existing = blocksByColumn.get(block.colIndex) ?? []
      existing.push(block)
      blocksByColumn.set(block.colIndex, existing)
    }

      const positionedBlocks: PositionedMeetingBlock[] = []

      const finalizeOverlapGroup = (groupBlocks: typeof blocks) => {
        if (groupBlocks.length === 0) {
          return
        }

        const laneEndTimes: number[] = []
        const withLane = groupBlocks.map((block) => {
          let lane = 0
          while (lane < laneEndTimes.length && laneEndTimes[lane] > block.startOffset) {
            lane += 1
          }

          laneEndTimes[lane] = Math.max(laneEndTimes[lane] ?? -Infinity, block.endOffset)
          return { ...block, lane }
        })

        const laneCount = laneEndTimes.length
        for (const block of withLane) {
          positionedBlocks.push({
            ...block,
            laneCount,
          })
        }
      }

      for (let colIndex = 0; colIndex < WEEK_COLUMNS.length; colIndex += 1) {
        const columnBlocks = blocksByColumn.get(colIndex)
        if (!columnBlocks?.length) {
          continue
      }

        const ordered = [...columnBlocks].sort(
          (left, right) => left.startOffset - right.startOffset || left.endOffset - right.endOffset
        )
        let currentGroup: typeof blocks = []
        let currentGroupEnd = -Infinity

        for (const block of ordered) {
          if (currentGroup.length > 0 && block.startOffset >= currentGroupEnd) {
            finalizeOverlapGroup(currentGroup)
            currentGroup = []
            currentGroupEnd = -Infinity
          }

          currentGroup.push(block)
          currentGroupEnd = Math.max(currentGroupEnd, block.endOffset)
        }

        finalizeOverlapGroup(currentGroup)
      }

    return positionedBlocks.sort((left, right) => left.colIndex - right.colIndex || left.topPx - right.topPx)
  }, [decisionByBaselineId, filteredBaselineMeetings, filteredProposalMeetings])

  const selectedBaselineDecision = selectedBaselineId
    ? decisionByBaselineId.get(selectedBaselineId) ?? "continue"
    : null
  const hasActiveScenario = activeScenarioId !== null
  const isBaselineMode =
    activeScenarioId !== null &&
    baselineScenarioId !== null &&
    activeScenarioId === baselineScenarioId
  const isProposalMode =
    activeScenarioId !== null &&
    baselineScenarioId !== null &&
    activeScenarioId !== baselineScenarioId

  useEffect(() => {
    if (isBaselineMode && colorMode === "action") {
      setColorMode("owner")
    }
  }, [colorMode, isBaselineMode])

  useEffect(() => {
    if (!isProposalMode && filters.action !== ALL_FILTER_VALUE) {
      setFilters((current) => ({
        ...current,
        action: ALL_FILTER_VALUE,
      }))
    }
  }, [filters.action, isProposalMode])

  const openProposalMeeting = useCallback((meetingId: number) => {
    const meeting = proposalById.get(meetingId)
    if (!meeting) {
      return
    }

    setSelectedBaselineId(null)
    setSelectedBaselineBlockKey(null)
    setDraft(getMeetingDraft(meeting, linksByProposalId.get(meetingId) ?? []))
    setAttendeeSelectionValue("")
    setMeetingSheetOpen(true)
  }, [linksByProposalId, proposalById])

  const openBaselineMeeting = useCallback((blockKey: string, meetingId: number) => {
    if (isBaselineMode) {
      const meeting = baselineById.get(meetingId)
      if (!meeting) {
        return
      }

      setSelectedBaselineId(null)
      setSelectedBaselineBlockKey(null)
      setDraft(getMeetingDraft(meeting, []))
      setAttendeeSelectionValue("")
      setMeetingSheetOpen(true)
      return
    }

    const shouldClose = selectedBaselineBlockKey === blockKey
    setSelectedBaselineBlockKey(shouldClose ? null : blockKey)
    setSelectedBaselineId(shouldClose ? null : meetingId)
  }, [baselineById, isBaselineMode, selectedBaselineBlockKey])

  const handleCreateMeeting = useCallback(() => {
    const baselineIds =
      isProposalMode && selectedBaselineId && selectedBaselineDecision === "change"
        ? [selectedBaselineId]
        : []
    setSelectedBaselineId(null)
    setSelectedBaselineBlockKey(null)
    setDraft(createEmptyDraft(baselineIds))
    setAttendeeSelectionValue("")
    setMeetingSheetOpen(true)
  }, [isProposalMode, selectedBaselineDecision, selectedBaselineId])

  const handleCreateReplacement = useCallback((baselineMeetingId: number) => {
    setSelectedBaselineId(null)
    setSelectedBaselineBlockKey(null)
    setDraft(createEmptyDraft([baselineMeetingId]))
    setAttendeeSelectionValue("")
    setMeetingSheetOpen(true)
  }, [])

  const handleSaveMeeting = async () => {
    setSaving(true)
    try {
      await onSaveMeeting({
        id: draft.id,
        rowOrder: draft.rowOrder,
        sourceMeetingId: draft.sourceMeetingId,
        submissionDate: draft.submissionDate,
        ownerName: draft.ownerName,
        meetingName: draft.meetingName,
        time: formatMinutesToTime(draft.startMinutes),
        frequency: formatRecurrence({
          weekdays: draft.weekdays,
          cadence: draft.cadence,
        }),
        duration: formatDurationMinutes(draft.durationMinutes),
        primaryPurpose: draft.primaryPurpose,
        attendees: draft.attendees,
        clientIfApplicable: draft.clientIfApplicable,
        notes: draft.notes,
        sourceExcelRow: draft.sourceExcelRow,
        baselineMeetingIds: isProposalMode
          ? draft.baselineMeetingIds.filter(
              (meetingId) => (decisionByBaselineId.get(meetingId) ?? "continue") === "change"
            )
          : [],
      })
      setMeetingSheetOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMeeting = async () => {
    if (!draft.id) {
      return
    }

    setSaving(true)
    try {
      await onDeleteMeeting(draft.id)
      setDraft(createEmptyDraft())
      setAttendeeSelectionValue("")
      setMeetingSheetOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleRestoreBaseline = async () => {
    if (!isBaselineMode) {
      return
    }

    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Restore the As-is schedule from the original CSV? This removes baseline-only edits and added meetings."
      )
    ) {
      return
    }

    setRestoring(true)
    try {
      setSelectedBaselineId(null)
      setSelectedBaselineBlockKey(null)
      setDraft(createEmptyDraft())
      setAttendeeSelectionValue("")
      setMeetingSheetOpen(false)
      await onRestoreBaselineSchedule()
    } finally {
      setRestoring(false)
    }
  }

  const clearFilters = useCallback(
    () =>
      setFilters({
        person: ALL_FILTER_VALUE,
        client: ALL_FILTER_VALUE,
        purpose: ALL_FILTER_VALUE,
        action: ALL_FILTER_VALUE,
      }),
    []
  )
  const hasActiveFilters =
    filters.person !== ALL_FILTER_VALUE ||
    filters.client !== ALL_FILTER_VALUE ||
    filters.purpose !== ALL_FILTER_VALUE ||
    filters.action !== ALL_FILTER_VALUE
  const addAttendeeToDraft = useCallback(
    (value: string) => {
      const normalized = normalizeFilterValue(value)
      const fromOptions = attendeeLabelByValue.get(normalized)
      const attendee = (fromOptions ?? value).trim()
      setAttendeeSelectionValue("")

      if (!attendee) {
        return
      }

      setDraft((current) => {
        const currentAttendees = parseAttendeeList(current.attendees)
        if (
          currentAttendees.some(
            (currentAttendee) => normalizeFilterValue(currentAttendee) === normalizeFilterValue(attendee)
          )
        ) {
          return current
        }

        return {
          ...current,
          attendees: formatAttendeeList([...currentAttendees, attendee]),
        }
      })
    },
    [attendeeLabelByValue]
  )
  const removeAttendeeFromDraft = useCallback((attendeeToRemove: string) => {
    setDraft((current) => ({
      ...current,
      attendees: formatAttendeeList(
        parseAttendeeList(current.attendees).filter(
          (attendee) => normalizeFilterValue(attendee) !== normalizeFilterValue(attendeeToRemove)
        )
      ),
    }))
  }, [])

  useEffect(() => {
    const handleOpenMeetingEditor = () => {
      if (!hasActiveScenario) {
        return
      }

      handleCreateMeeting()
    }

    window.addEventListener(
      OPEN_PROPOSAL_MEETING_EDITOR_EVENT,
      handleOpenMeetingEditor as EventListener
    )

    return () =>
      window.removeEventListener(
        OPEN_PROPOSAL_MEETING_EDITOR_EVENT,
        handleOpenMeetingEditor as EventListener
      )
  }, [handleCreateMeeting, hasActiveScenario])

  const availableColorModeOptions = isProposalMode
    ? COLOR_MODE_OPTIONS
    : COLOR_MODE_OPTIONS.filter((option) => option.value !== "action")
  const createMeetingLabel = isProposalMode ? "New proposal meeting" : "New meeting"
  const meetingSheetTitle = draft.id ? "Edit meeting" : createMeetingLabel
  const meetingSheetDescription = isProposalMode
    ? "Define the meeting and map replacements to baseline meetings marked as Change."
    : "Edit the As-is schedule directly or add meetings to the baseline."

  return (
    <div className="grid gap-5">
      {hasActiveScenario ? (
        <div className="flex min-h-[calc(100svh-var(--header-height)-4rem)] flex-col px-4 sm:px-6 lg:px-8">
          <section
            id="scenario-schedule"
            className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.35rem] border border-border/70 bg-background/45"
          >
            <div
              id="scenario-controls"
              className="surface-subtle border-b border-border/70 px-3 py-3 sm:px-4"
            >
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="grid gap-3 min-[420px]:grid-cols-2 xl:flex xl:flex-wrap xl:items-center">
                  <ScenarioToolbarSelect
                    ariaLabel="Filter meetings by owner"
                    placeholder="Owner"
                    icon={<User2Icon className="size-4 text-muted-foreground" />}
                    value={filters.person}
                    onValueChange={(value) =>
                      setFilters((current) => ({
                        ...current,
                        person: value,
                      }))
                    }
                    triggerClassName="h-11 w-full rounded-2xl bg-background/85 md:h-10 md:rounded-lg xl:w-[150px]"
                    options={[
                      { value: ALL_FILTER_VALUE, label: "All owners" },
                      ...personFilterOptions.map((option) => ({
                        value: option.value,
                        label: option.label,
                        disabled:
                          filters.person !== option.value &&
                          (facetCounts.person.get(option.value) ?? 0) === 0,
                      })),
                    ]}
                  />
                  <ScenarioToolbarSelect
                    ariaLabel="Filter meetings by client"
                    placeholder="Client"
                    icon={<Building2Icon className="size-4 text-muted-foreground" />}
                    value={filters.client}
                    onValueChange={(value) =>
                      setFilters((current) => ({
                        ...current,
                        client: value,
                      }))
                    }
                    triggerClassName="h-11 w-full rounded-2xl bg-background/85 md:h-10 md:rounded-lg xl:w-[150px]"
                    options={[
                      { value: ALL_FILTER_VALUE, label: "All clients" },
                      ...clientFilterOptions.map((option) => ({
                        value: option.value,
                        label: option.label,
                        disabled:
                          filters.client !== option.value &&
                          (facetCounts.client.get(option.value) ?? 0) === 0,
                      })),
                    ]}
                  />
                  <ScenarioToolbarSelect
                    ariaLabel="Filter meetings by type"
                    placeholder="Type"
                    icon={<TagIcon className="size-4 text-muted-foreground" />}
                    value={filters.purpose}
                    onValueChange={(value) =>
                      setFilters((current) => ({
                        ...current,
                        purpose: value,
                      }))
                    }
                    triggerClassName="h-11 w-full rounded-2xl bg-background/85 md:h-10 md:rounded-lg xl:w-[150px]"
                    options={[
                      { value: ALL_FILTER_VALUE, label: "All types" },
                      ...purposeFilterOptions.map((option) => ({
                        value: option.value,
                        label: option.label,
                        disabled:
                          filters.purpose !== option.value &&
                          (facetCounts.purpose.get(option.value) ?? 0) === 0,
                      })),
                    ]}
                  />
                  {isProposalMode ? (
                    <ScenarioToolbarSelect
                      ariaLabel="Filter meetings by scenario action"
                      placeholder="Action"
                      icon={<GitBranchIcon className="size-4 text-muted-foreground" />}
                      value={filters.action}
                      onValueChange={(value) =>
                        setFilters((current) => ({
                          ...current,
                          action: value as ScheduleActionFilterValue,
                        }))
                      }
                      triggerClassName="h-11 w-full rounded-2xl bg-background/85 md:h-10 md:rounded-lg xl:w-[168px]"
                      options={[
                        { value: ALL_FILTER_VALUE, label: "All actions" },
                        ...ACTION_FILTER_OPTIONS.map((option) => ({
                          value: option.value,
                          label: option.label,
                          disabled:
                            filters.action !== option.value &&
                            (facetCounts.action.get(option.value) ?? 0) === 0,
                        })),
                      ]}
                    />
                  ) : null}
                  <ScenarioToolbarSelect
                    ariaLabel="Choose meeting color mode"
                    placeholder="Color by"
                    icon={<PaletteIcon className="size-4 text-muted-foreground" />}
                    value={colorMode}
                    onValueChange={(value) => setColorMode(value as ScheduleColorMode)}
                    triggerClassName="h-11 w-full rounded-2xl bg-background/85 md:h-10 md:rounded-lg xl:w-[168px]"
                    options={availableColorModeOptions.map((option) => ({
                      value: option.value,
                      label: option.label,
                    }))}
                  />
                </div>

                <div className="grid gap-3 min-[420px]:grid-cols-2 xl:flex xl:flex-wrap xl:items-center">
                  <Button
                    variant="outline"
                    className="h-11 rounded-2xl bg-background/85 px-4 shadow-none md:h-10 md:rounded-lg"
                    onClick={handleCreateMeeting}
                  >
                    <PlusIcon className="size-4" />
                    {createMeetingLabel}
                  </Button>
                  {isBaselineMode ? (
                    <Button
                      variant="outline"
                      className="h-11 rounded-2xl bg-background/85 px-4 shadow-none md:h-10 md:rounded-lg"
                      onClick={() => void handleRestoreBaseline()}
                      disabled={restoring}
                    >
                      <RotateCcwIcon className="size-4" />
                      {restoring ? "Restoring..." : "Restore"}
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    className="h-11 rounded-2xl bg-background/85 px-4 shadow-none md:h-10 md:rounded-lg"
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                  >
                    Clear filters
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-background/40 p-3">
              <div className="min-w-[1300px]">
                <div className="grid grid-cols-[74px_repeat(10,minmax(120px,1fr))] border-b border-border/70">
                  <div className="p-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Time
                  </div>
                  {WEEK_COLUMNS.map((column) => (
                    <div
                      key={`${column.week}-${column.weekday}`}
                      className="border-l border-border/60 p-2 text-center text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground"
                    >
                      {column.label}
                    </div>
                  ))}
                </div>

                <div className="relative grid grid-cols-[74px_repeat(10,minmax(120px,1fr))]">
                  <div className="relative" style={{ height: GRID_HEIGHT_PX }}>
                    {Array.from({ length: 13 }).map((_, index) => {
                      const hour = 7 + index
                      return (
                        <div
                          key={hour}
                          className="absolute inset-x-0 text-center text-xs text-muted-foreground"
                          style={{ top: (index / 12) * GRID_HEIGHT_PX - 8 }}
                        >
                          {formatMinutesToTime(hour * 60)}
                        </div>
                      )
                    })}
                  </div>

                  {WEEK_COLUMNS.map((column, index) => (
                    <div
                      key={`${column.week}-${column.weekday}-${index}`}
                      className="relative border-l border-border/60"
                      style={{ height: GRID_HEIGHT_PX }}
                    >
                      {Array.from({ length: 12 }).map((_, lineIndex) => (
                        <div
                          key={lineIndex}
                          className="absolute inset-x-0 border-t border-border/35"
                          style={{ top: (lineIndex / 12) * GRID_HEIGHT_PX }}
                        />
                      ))}

                      {scheduleBlocks
                        .filter((block) => block.colIndex === index)
                        .map((block) => {
                          const selected =
                            selectedBaselineBlockKey === block.key && block.kind === "baseline"
                          const borderColor = getToneBorderColor(block.tone)
                          const backgroundColor = getBlockBackgroundColor({
                            colorMode,
                            entityColors,
                            clientLabel: block.clientLabel,
                            ownerName: block.ownerName,
                            purpose: block.purpose,
                            purposeColorMap,
                            tone: block.tone,
                          })
                          const textColor = getBlockTextColor(block.tone)
                          const detailColor = getBlockDetailColor(block.tone)
                          const metaColor = getBlockMetaColor(block.tone)
                          const blockCard = (
                            <div
                              className="absolute rounded-sm border px-2 py-1 text-[11px] leading-tight transition-colors"
                              style={{
                                top: block.topPx,
                                minHeight: block.heightPx,
                                left: `calc(${(block.lane / block.laneCount) * 100}% + 2px)`,
                                width: `calc(${100 / block.laneCount}% - 4px)`,
                                borderColor,
                                background: backgroundColor,
                                color: textColor,
                                boxShadow: selected
                                  ? "0 0 0 1px color-mix(in oklch, var(--primary) 35%, transparent)"
                                  : undefined,
                              }}
                              role="button"
                              tabIndex={0}
                              onClick={() =>
                                block.kind === "proposal"
                                  ? openProposalMeeting(block.meetingId)
                                  : openBaselineMeeting(block.key, block.meetingId)
                              }
                              onKeyDown={(event) => {
                                if (event.key !== "Enter" && event.key !== " ") {
                                  return
                                }

                                event.preventDefault()
                                if (block.kind === "proposal") {
                                  openProposalMeeting(block.meetingId)
                                  return
                                }

                                openBaselineMeeting(block.key, block.meetingId)
                              }}
                              title={`${block.title} | ${block.detail}`}
                              aria-label={
                                block.kind === "proposal" || isBaselineMode
                                  ? "Edit meeting"
                                  : "Choose scenario action"
                              }
                            >
                              <p
                                className={`font-medium ${block.tone === "cancel" ? "line-through" : ""}`}
                                style={{ color: textColor }}
                              >
                                {block.title}
                              </p>
                              <p
                                className={block.tone === "cancel" ? "line-through" : undefined}
                                style={{ color: detailColor }}
                              >
                                {block.detail}
                              </p>
                              <p
                                className="mt-1 text-[10px] uppercase tracking-[0.12em]"
                                style={{ color: metaColor }}
                              >
                                {isBaselineMode
                                  ? "as-is"
                                  : block.kind === "proposal"
                                    ? "proposal"
                                    : block.tone}
                              </p>
                            </div>
                          )

                          if (block.kind === "proposal" || isBaselineMode) {
                            return <div key={block.key}>{blockCard}</div>
                          }

                          const baselineMeeting = baselineById.get(block.meetingId)
                          const baselineDecision =
                            decisionByBaselineId.get(block.meetingId) ?? "continue"
                          const linkedProposalIds = linksByBaselineId.get(block.meetingId) ?? []

                          if (!baselineMeeting) {
                            return <div key={block.key}>{blockCard}</div>
                          }

                          return (
                            <Popover
                              key={block.key}
                              open={selectedBaselineBlockKey === block.key}
                              onOpenChange={(open) => {
                                setSelectedBaselineBlockKey(open ? block.key : null)
                                setSelectedBaselineId(open ? block.meetingId : null)
                              }}
                            >
                              <PopoverTrigger render={blockCard} />
                              <PopoverContent
                                align="start"
                                sideOffset={8}
                                className="w-80 rounded-xl border border-border/70 bg-background/95 p-3 shadow-lg backdrop-blur"
                              >
                                <PopoverHeader className="gap-1">
                                  <PopoverTitle className="text-sm text-foreground">
                                    {baselineMeeting.meeting_name}
                                  </PopoverTitle>
                                  <PopoverDescription className="text-xs">
                                    {baselineMeeting.owner_name} | {baselineMeeting.time} |{" "}
                                    {baselineMeeting.frequency}
                                  </PopoverDescription>
                                  <PopoverDescription className="text-xs">
                                    {baselineMeeting.primary_purpose}
                                  </PopoverDescription>
                                </PopoverHeader>

                                <div className="grid gap-2">
                                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                    Scenario action
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    <DecisionButton
                                      label="Continue"
                                      active={baselineDecision === "continue"}
                                      onClick={() =>
                                        void onSetDecision(baselineMeeting.id, "continue")
                                      }
                                    />
                                    <DecisionButton
                                      label="Cancel"
                                      active={baselineDecision === "cancel"}
                                      onClick={() =>
                                        void onSetDecision(baselineMeeting.id, "cancel")
                                      }
                                    />
                                    <DecisionButton
                                      label="Change"
                                      active={baselineDecision === "change"}
                                      onClick={() =>
                                        void onSetDecision(baselineMeeting.id, "change")
                                      }
                                    />
                                  </div>
                                </div>

                                {baselineDecision === "change" ? (
                                  <div className="grid gap-2 rounded-xl border border-border/70 bg-background/70 p-3">
                                    <div>
                                      <p className="text-sm font-medium text-foreground">
                                        Replacement meeting
                                      </p>
                                      <p className="mt-1 text-xs text-muted-foreground">
                                        Create a new replacement or edit an existing linked proposal.
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCreateReplacement(baselineMeeting.id)}
                                      >
                                        <PlusIcon className="size-4" />
                                        Create replacement
                                      </Button>
                                      {linkedProposalIds.map((proposalId) => (
                                        <Button
                                          key={proposalId}
                                          variant="outline"
                                          size="sm"
                                          onClick={() => openProposalMeeting(proposalId)}
                                        >
                                          Edit linked proposal
                                        </Button>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                              </PopoverContent>
                            </Popover>
                          )
                        })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {scheduleBlocks.length === 0 ? (
              <p className="mx-3 mb-3 rounded-lg border border-dashed border-border/70 p-3 text-sm text-muted-foreground">
                No meetings are visible in the schedule with the current filters.
              </p>
            ) : null}
            {isProposalMode ? (
              <div
                id="scenario-legend"
                className="flex flex-wrap items-center justify-end gap-3 border-t border-border/70 px-4 py-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground"
              >
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-slate-400/80" />
                  Continue
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-amber-500/80" />
                  Change
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-red-500/80" />
                  Cancel
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-primary/80" />
                  Proposal
                </span>
              </div>
            ) : null}
          </section>

          <Sheet
            open={meetingSheetOpen}
            onOpenChange={(open) => {
              setMeetingSheetOpen(open)
            }}
          >
            <SheetContent
              side="right"
              className="w-full overflow-hidden border-l border-border/70 bg-background/98 data-[side=right]:sm:max-w-2xl"
            >
              <SheetHeader className="surface-subtle border-b border-border/70 px-4 py-3">
                <SheetTitle>{meetingSheetTitle}</SheetTitle>
                <SheetDescription>{meetingSheetDescription}</SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="grid gap-4 rounded-[1.25rem] border border-border/70 bg-background/60 p-4">
                  <Input
                    placeholder="Meeting name"
                    value={draft.meetingName}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, meetingName: event.target.value }))
                    }
                  />
                  <Input
                    placeholder="Owner"
                    value={draft.ownerName}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, ownerName: event.target.value }))
                    }
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <label className="grid gap-1 text-xs text-muted-foreground">
                      Start time
                      <Input
                        type="time"
                        value={`${Math.floor(draft.startMinutes / 60)
                          .toString()
                          .padStart(2, "0")}:${(draft.startMinutes % 60)
                          .toString()
                          .padStart(2, "0")}`}
                        onChange={(event) => {
                          const [hours, minutes] = event.target.value.split(":").map(Number)
                          if (Number.isNaN(hours) || Number.isNaN(minutes)) return
                          setDraft((current) => ({
                            ...current,
                            startMinutes: hours * 60 + minutes,
                          }))
                        }}
                      />
                    </label>

                    <label className="grid gap-1 text-xs text-muted-foreground">
                      Duration (min)
                      <Input
                        type="number"
                        min={5}
                        step={5}
                        value={draft.durationMinutes}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            durationMinutes: Number.parseInt(event.target.value, 10) || 30,
                          }))
                        }
                      />
                    </label>
                  </div>

                  <label className="grid gap-1 text-xs text-muted-foreground">
                    Cadence
                    <select
                      className="h-8 rounded-lg border border-border bg-background/80 px-2 text-sm text-foreground"
                      value={draft.cadence}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          cadence: event.target.value as MeetingDraft["cadence"],
                        }))
                      }
                    >
                      <option value="Weekly">Weekly</option>
                      <option value="Biweekly">Biweekly</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                  </label>

                  <div className="grid gap-1 text-xs text-muted-foreground">
                    <p>Weekdays</p>
                    <div className="flex flex-wrap gap-1">
                      {WEEKDAYS.map((weekday) => {
                        const selected = draft.weekdays.includes(weekday)
                        return (
                          <button
                            key={weekday}
                            type="button"
                            className={`rounded-full border px-2 py-1 text-xs ${
                              selected
                                ? "border-primary/70 bg-primary/10 text-foreground"
                                : "border-border/70 bg-background/70"
                            }`}
                            onClick={() =>
                              setDraft((current) => ({
                                ...current,
                                weekdays: selected
                                  ? current.weekdays.filter((value) => value !== weekday)
                                  : [...current.weekdays, weekday],
                              }))
                            }
                          >
                            {weekday.slice(0, 3)}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="grid gap-1 text-xs text-muted-foreground">
                    <p>Attendees</p>
                    <Combobox
                      data={attendeeOptions}
                      type="attendee"
                      value={attendeeSelectionValue}
                      onValueChange={addAttendeeToDraft}
                    >
                      <ComboboxTrigger className="h-8 w-full justify-between rounded-lg border-border bg-background/80 px-2 text-sm font-normal text-foreground">
                        <span className="flex w-full items-center justify-between gap-2">
                          <span className="truncate">
                            {selectedAttendees.length > 0
                              ? "Add another attendee"
                              : "Select attendee"}
                          </span>
                          <PlusIcon className="size-4 text-muted-foreground" />
                        </span>
                      </ComboboxTrigger>
                      <ComboboxContent>
                        <ComboboxInput />
                        <ComboboxList>
                          <ComboboxEmpty />
                          <ComboboxGroup>
                            {attendeeOptions.map((option) => (
                              <ComboboxItem key={option.value} value={option.value}>
                                <CheckIcon
                                  className={`mr-2 size-4 ${
                                    selectedAttendeeValueSet.has(option.value)
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                                {option.label}
                              </ComboboxItem>
                            ))}
                          </ComboboxGroup>
                          <ComboboxCreateNew onCreateNew={addAttendeeToDraft}>
                            {(inputValue) => (
                              <>
                                <PlusIcon className="size-4 text-muted-foreground" />
                                <span>Add attendee &quot;{inputValue}&quot;</span>
                              </>
                            )}
                          </ComboboxCreateNew>
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    {selectedAttendees.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedAttendees.map((attendee) => (
                          <button
                            key={attendee}
                            type="button"
                            className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/80 px-2 py-1 text-xs text-foreground"
                            onClick={() => removeAttendeeFromDraft(attendee)}
                            title={`Remove ${attendee}`}
                          >
                            <span>{attendee}</span>
                            <XIcon className="size-3.5 text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No attendees selected.</p>
                    )}
                  </div>
                  <Input
                    placeholder="Client (optional)"
                    value={draft.clientIfApplicable}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        clientIfApplicable: event.target.value,
                      }))
                    }
                  />
                  <Input
                    placeholder="Primary purpose"
                    value={draft.primaryPurpose}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        primaryPurpose: event.target.value,
                      }))
                    }
                  />
                  <Input
                    placeholder="Notes"
                    value={draft.notes}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, notes: event.target.value }))
                    }
                  />

                  {isProposalMode ? (
                    <div className="grid gap-1 text-xs text-muted-foreground">
                      <p>Replaces baseline meetings</p>
                      <div className="max-h-36 overflow-auto rounded-lg border border-border/70 bg-background/70 p-2">
                        {replaceableBaselineMeetings.map((meeting) => {
                          const selected = draft.baselineMeetingIds.includes(meeting.id)
                          return (
                            <label
                              key={meeting.id}
                              className="flex cursor-pointer items-start gap-2 py-1"
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={(event) =>
                                  setDraft((current) => ({
                                    ...current,
                                    baselineMeetingIds: event.target.checked
                                      ? [...new Set([...current.baselineMeetingIds, meeting.id])]
                                      : current.baselineMeetingIds.filter(
                                          (id) => id !== meeting.id
                                        ),
                                  }))
                                }
                              />
                              <span>
                                {meeting.meeting_name} ({meeting.time})
                              </span>
                            </label>
                          )
                        })}
                        {replaceableBaselineMeetings.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            No baseline meetings marked as Change match the current filters.
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap justify-end gap-2">
                    {draft.id ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void handleDeleteMeeting()}
                      >
                        <Trash2Icon className="size-4" />
                        Delete
                      </Button>
                    ) : null}
                    <Button size="sm" disabled={saving} onClick={() => void handleSaveMeeting()}>
                      <SaveIcon className="size-4" />
                      Save meeting
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      ) : (
        <div className="flex min-h-[calc(100svh-var(--header-height)-4rem)] items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="w-full max-w-2xl rounded-[1rem] border border-border/70 bg-background/40 p-8 text-center">
            <p className="text-sm font-medium text-foreground">Select a scenario to edit</p>
          </div>
        </div>
      )}
    </div>
  )
}

function ScenarioToolbarSelect({
  icon,
  value,
  onValueChange,
  ariaLabel,
  placeholder,
  options,
  triggerClassName,
}: {
  icon: ReactNode
  value: string
  onValueChange: (value: string) => void
  ariaLabel: string
  placeholder: string
  options: Array<{
    value: string
    label: string
    disabled?: boolean
  }>
  triggerClassName: string
}) {
  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? placeholder

  return (
    <Select
      value={value}
      onValueChange={(nextValue) => {
        if (nextValue) {
          onValueChange(nextValue)
        }
      }}
    >
      <SelectTrigger className={triggerClassName} aria-label={ariaLabel}>
        <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
          {icon}
          <span className="truncate">{selectedLabel}</span>
        </span>
      </SelectTrigger>
      <SelectContent align="start" className="rounded-xl">
        {options.map((option) => (
          <SelectItem key={`${ariaLabel}-${option.value}`} value={option.value} disabled={option.disabled}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function DecisionButton({
  label,
  active,
  disabled = false,
  onClick,
}: {
  label: string
  active: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`rounded-full border px-2.5 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
        active
          ? "border-primary/70 bg-primary/10 text-foreground"
          : "border-border/70 bg-background/80 text-muted-foreground"
      }`}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
    >
      {label}
    </button>
  )
}
