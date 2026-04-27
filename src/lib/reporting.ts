import Papa from "papaparse"

import {
  TIME_BUCKETS,
  WEEKDAYS,
  type BiweeklyWeek,
  type Cadence,
  type ClientMetric,
  type CsvMeetingRow,
  type HeatCellMetric,
  type KpiMetric,
  type MeetingRecord,
  type OwnerMetric,
  type PersonBreakdownMetric,
  type PersonMetric,
  type PurposeMetric,
  type QualityNote,
  type ReportSummaryOptions,
  type ReportSummary,
  type TimeBucketLabel,
  type Weekday,
} from "@/types/report"

const CADENCE_FACTORS: Record<Cadence, number> = {
  Weekly: 1,
  Biweekly: 0.5,
  Monthly: 0.25,
  Unspecified: 1,
}

const SYNTHETIC_START = new Date("2026-01-05T00:00:00")
const HEATMAP_BUCKET_INDEXES = [4, 5, 6, 7, 8]
const DEFAULT_COST_PER_PERSON_HOUR_USD = 100

function clean(value: string | undefined): string {
  return (value ?? "").trim()
}

function parseCadence(parts: string[]): Cadence {
  if (parts.includes("Weekly")) return "Weekly"
  if (parts.includes("Biweekly")) return "Biweekly"
  if (parts.includes("Monthly")) return "Monthly"
  return "Weekly"
}

function parseBiweeklyWeek(parts: string[]): BiweeklyWeek | null {
  if (parts.includes("Week 1")) return "Week 1"
  if (parts.includes("Week 2")) return "Week 2"
  return null
}

function parseDurationMinutes(duration: string) {
  const match = duration.match(/(\d+)/)
  const minutes = match ? Number.parseInt(match[1], 10) : 0
  return {
    minutes,
    approximate: duration.includes("+"),
  }
}

function parseStartMinutes(time: string) {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return 0

  let hour = Number.parseInt(match[1], 10) % 12
  const minute = Number.parseInt(match[2], 10)
  const meridiem = match[3].toUpperCase()

  if (meridiem === "PM") {
    hour += 12
  }

  return hour * 60 + minute
}

function formatHours(value: number) {
  return `${value.toFixed(1)}h`
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatBucketLabel(index: number): TimeBucketLabel {
  return TIME_BUCKETS[index] ?? TIME_BUCKETS[0]
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function createSyntheticDate(bucketIndex: number, weekdayIndex: number) {
  const date = new Date(SYNTHETIC_START)
  date.setDate(SYNTHETIC_START.getDate() + bucketIndex * 7 + weekdayIndex)
  return date
}

function normalizeNameToken(value: string) {
  return clean(value).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ")
}

function titleCaseName(value: string) {
  return clean(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")
}

function createOwnerNameNormalizer(ownerNames: string[]) {
  const profiles = [...new Set(ownerNames.map(clean).filter(Boolean))].map((name) => {
    const tokens = normalizeNameToken(name).split(" ").filter(Boolean)

    return {
      display: clean(name),
      normalized: tokens.join(" "),
      first: tokens[0] ?? "",
      last: tokens.at(-1) ?? "",
    }
  })

  return (name: string) => {
    const normalized = normalizeNameToken(name)
    if (!normalized) return clean(name)

    const exact = profiles.find((profile) => profile.normalized === normalized)
    if (exact) return exact.display

    const tokens = normalized.split(" ").filter(Boolean)
    if (tokens.length === 1) {
      const token = tokens[0]
      const matches = profiles.filter(
        (profile) =>
          profile.first === token ||
          profile.last === token ||
          profile.first.startsWith(token) ||
          token.startsWith(profile.first) ||
          profile.last.startsWith(token) ||
          token.startsWith(profile.last)
      )

      if (matches.length === 1) {
        return matches[0].display
      }
    }

    const partialMatches = profiles.filter(
      (profile) =>
        profile.normalized.startsWith(normalized) || normalized.startsWith(profile.normalized)
    )

    if (partialMatches.length === 1) {
      return partialMatches[0].display
    }

    return titleCaseName(name)
  }
}

function attendeeMatchesOwner(attendee: string, ownerName: string) {
  const attendeeTokens = normalizeNameToken(attendee).split(" ").filter(Boolean)
  const ownerTokens = normalizeNameToken(ownerName).split(" ").filter(Boolean)

  if (!attendeeTokens.length || !ownerTokens.length) {
    return false
  }

  const [ownerFirst = "", ownerLast = ""] = [ownerTokens[0] ?? "", ownerTokens.at(-1) ?? ""]
  const [attendeeFirst = "", attendeeLast = ""] = [
    attendeeTokens[0] ?? "",
    attendeeTokens.at(-1) ?? "",
  ]

  const tokenMatches = (left: string, right: string) =>
    left === right || left.startsWith(right) || right.startsWith(left)

  return (
    attendeeTokens.join(" ") === ownerTokens.join(" ") ||
    attendeeTokens.join(" ").includes(ownerTokens.join(" ")) ||
    ownerTokens.join(" ").includes(attendeeTokens.join(" ")) ||
    tokenMatches(attendeeFirst, ownerFirst) ||
    tokenMatches(attendeeFirst, ownerLast) ||
    tokenMatches(attendeeLast, ownerLast)
  )
}

function parseClientLabel(value: string) {
  return clean(value) || "Internal"
}

export function parseMeetingCsvRows(csvText: string): CsvMeetingRow[] {
  const parsed = Papa.parse<CsvMeetingRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  })

  return parsed.data
}

export function normalizeMeetingRows(rows: CsvMeetingRow[]): MeetingRecord[] {
  return rows.map((row) => {
    const frequencyParts = clean(row.frequency)
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)

    const weekdays = frequencyParts.filter((part): part is Weekday =>
      (WEEKDAYS as readonly string[]).includes(part)
    )

    const cadence = parseCadence(frequencyParts)
    const biweeklyWeek = cadence === "Biweekly" ? parseBiweeklyWeek(frequencyParts) : null
    const cadenceFactor = CADENCE_FACTORS[cadence]
    const { minutes: durationMinutes, approximate } = parseDurationMinutes(
      clean(row.duration)
    )
    const attendeeList = clean(row.attendees)
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
    const ownerName = clean(row.owner_name)

    if (ownerName && !attendeeList.some((attendee) => attendeeMatchesOwner(attendee, ownerName))) {
      attendeeList.push(ownerName)
    }

    const attendeeCount = attendeeList.length
    const startMinutes = parseStartMinutes(clean(row.time))
    const timeBucketIndex = Math.min(11, Math.max(0, Math.floor(startMinutes / 120)))
    const weeklyOccurrenceCount = Math.max(weekdays.length, 1)
    const dataNotes: string[] = []
    const clientLabel = parseClientLabel(clean(row.client_if_applicable))

    if (approximate) {
      dataNotes.push(`Approximate duration entered as ${clean(row.duration)}.`)
    }

    if (weekdays.length === 0) {
      dataNotes.push("No weekday listed; excluded from weekday heat map totals.")
    }

    if (cadence === "Biweekly" && !biweeklyWeek) {
      dataNotes.push(
        "Biweekly meeting has no Week 1/Week 2 assignment; shown in both schedule weeks until assigned."
      )
    }

    if (clean(row.notes)) {
      dataNotes.push(clean(row.notes))
    }

    return {
      ...row,
      submission_date: clean(row.submission_date),
      owner_name: ownerName,
      meeting_name: clean(row.meeting_name),
      time: clean(row.time),
      frequency: clean(row.frequency),
      duration: clean(row.duration),
      primary_purpose: clean(row.primary_purpose),
      attendees: clean(row.attendees),
      client_if_applicable: clean(row.client_if_applicable),
      notes: clean(row.notes),
      source_excel_row: clean(row.source_excel_row),
      attendeeList,
      attendeeCount,
      weekdays,
      cadence,
      biweeklyWeek,
      cadenceFactor,
      durationMinutes,
      approximateDuration: approximate,
      startMinutes,
      startHour: Math.floor(startMinutes / 60),
      timeBucketIndex,
      timeBucketLabel: formatBucketLabel(timeBucketIndex),
      clientLabel,
      isInternal: clientLabel === "Internal",
      weeklyOccurrenceCount,
      weeklyAdjustedOccurrenceCount: weeklyOccurrenceCount * cadenceFactor,
      weeklyWeightedMinutes: durationMinutes * cadenceFactor * weeklyOccurrenceCount,
      weeklyWeightedAttendeeMinutes:
        durationMinutes * attendeeCount * cadenceFactor * weeklyOccurrenceCount,
      perOccurrenceWeightedAttendeeMinutes:
        durationMinutes * attendeeCount * cadenceFactor,
      dataNotes,
    }
  })
}

export function parseMeetingCsv(csvText: string): MeetingRecord[] {
  return normalizeMeetingRows(parseMeetingCsvRows(csvText))
}

function buildHeatCells(meetings: MeetingRecord[]) {
  const heatMap = new Map<string, HeatCellMetric>()

  for (const bucketIndex of HEATMAP_BUCKET_INDEXES) {
    for (let weekdayIndex = 0; weekdayIndex < WEEKDAYS.length; weekdayIndex += 1) {
      const weekday = WEEKDAYS[weekdayIndex]
      const date = createSyntheticDate(bucketIndex, weekdayIndex)
      const key = `${weekday}|${bucketIndex}`

      heatMap.set(key, {
        date: toDateKey(date),
        weekday,
        bucketIndex,
        bucketLabel: formatBucketLabel(bucketIndex),
        weight: 0,
        meetingCount: 0,
      })
    }
  }

  for (const meeting of meetings) {
    if (!HEATMAP_BUCKET_INDEXES.includes(meeting.timeBucketIndex)) {
      continue
    }

    for (const weekday of meeting.weekdays) {
      const key = `${weekday}|${meeting.timeBucketIndex}`
      const existing = heatMap.get(key)
      if (!existing) continue

      existing.weight += meeting.perOccurrenceWeightedAttendeeMinutes
      existing.meetingCount += 1
    }
  }

  return [...heatMap.values()].sort((left, right) => {
    if (left.bucketIndex !== right.bucketIndex) {
      return left.bucketIndex - right.bucketIndex
    }

    return WEEKDAYS.indexOf(left.weekday) - WEEKDAYS.indexOf(right.weekday)
  })
}

function groupMetrics<T extends string>(
  meetings: MeetingRecord[],
  getKey: (meeting: MeetingRecord) => T
) {
  const grouped = new Map<
    T,
    {
      meetingCount: number
      weeklyAttendeeMinutes: number
    }
  >()

  for (const meeting of meetings) {
    const key = getKey(meeting)
    const current = grouped.get(key) ?? {
      meetingCount: 0,
      weeklyAttendeeMinutes: 0,
    }

    current.meetingCount += 1
    current.weeklyAttendeeMinutes += meeting.weeklyWeightedAttendeeMinutes
    grouped.set(key, current)
  }

  return grouped
}

function buildOwnerMetrics(meetings: MeetingRecord[]): OwnerMetric[] {
  const grouped = new Map<
    string,
    {
      meetingCount: number
      weeklyMinutes: number
      weeklyAttendeeMinutes: number
    }
  >()

  for (const meeting of meetings) {
    const current = grouped.get(meeting.owner_name) ?? {
      meetingCount: 0,
      weeklyMinutes: 0,
      weeklyAttendeeMinutes: 0,
    }

    current.meetingCount += 1
    current.weeklyMinutes += meeting.weeklyWeightedMinutes
    current.weeklyAttendeeMinutes += meeting.weeklyWeightedAttendeeMinutes
    grouped.set(meeting.owner_name, current)
  }

  return [...grouped.entries()]
    .map(([ownerName, value]) => ({
      ownerName,
      ...value,
    }))
    .sort(
      (left, right) => right.weeklyAttendeeMinutes - left.weeklyAttendeeMinutes
    )
}

function buildPersonMetrics(meetings: MeetingRecord[]): PersonMetric[] {
  const normalizeParticipantName = createOwnerNameNormalizer(
    meetings.map((meeting) => meeting.owner_name)
  )
  const grouped = new Map<
    string,
    {
      meetingCount: number
      weeklyMinutes: number
      slotWeights: Map<string, number>
      clientWeights: Map<string, number>
      purposeWeights: Map<string, number>
      weekdayWeights: Map<Weekday, number>
    }
  >()

  for (const meeting of meetings) {
    const participants = [...new Set(
      meeting.attendeeList
        .map((participant) => clean(participant))
        .filter((participant) => participant && participant.toLowerCase() !== "client")
        .map((participant) => normalizeParticipantName(participant))
    )]

    for (const person of participants) {
      const current = grouped.get(person) ?? {
        meetingCount: 0,
        weeklyMinutes: 0,
        slotWeights: new Map<string, number>(),
        clientWeights: new Map<string, number>(),
        purposeWeights: new Map<string, number>(),
        weekdayWeights: new Map<Weekday, number>(),
      }

      current.meetingCount += 1
      current.weeklyMinutes += meeting.weeklyWeightedMinutes
      current.clientWeights.set(
        meeting.clientLabel,
        (current.clientWeights.get(meeting.clientLabel) ?? 0) + meeting.weeklyWeightedMinutes
      )
      current.purposeWeights.set(
        meeting.primary_purpose,
        (current.purposeWeights.get(meeting.primary_purpose) ?? 0) + meeting.weeklyWeightedMinutes
      )

      for (const weekday of meeting.weekdays) {
        const slotKey = `${weekday}|${meeting.timeBucketLabel}`
        const weekdayMinutes = meeting.durationMinutes * meeting.cadenceFactor

        current.slotWeights.set(
          slotKey,
          (current.slotWeights.get(slotKey) ?? 0) + weekdayMinutes
        )
        current.weekdayWeights.set(
          weekday,
          (current.weekdayWeights.get(weekday) ?? 0) + weekdayMinutes
        )
      }

      grouped.set(person, current)
    }
  }

  return [...grouped.entries()]
    .map(([name, value]) => {
      const [busiestSlotKey, busiestSlotMinutes] =
        [...value.slotWeights.entries()].sort((left, right) => right[1] - left[1])[0] ?? []
      const [busiestWeekday, busiestBucketLabel] = busiestSlotKey
        ? (busiestSlotKey.split("|") as [Weekday, TimeBucketLabel])
        : [null, null]

      return {
        name,
        meetingCount: value.meetingCount,
        weeklyMinutes: value.weeklyMinutes,
        busiestWeekday,
        busiestBucketLabel,
        busiestSlotMinutes: busiestSlotMinutes ?? 0,
        clientBreakdown: sortBreakdowns(value.clientWeights),
        purposeBreakdown: sortBreakdowns(value.purposeWeights),
        weekdayBreakdown: WEEKDAYS.map((weekday) => ({
          weekday,
          weeklyMinutes: value.weekdayWeights.get(weekday) ?? 0,
        })),
      }
    })
    .sort((left, right) => right.weeklyMinutes - left.weeklyMinutes)
}

function sortBreakdowns(source: Map<string, number>): PersonBreakdownMetric[] {
  return [...source.entries()]
    .map(([label, weeklyMinutes]) => ({ label, weeklyMinutes }))
    .sort((left, right) => right.weeklyMinutes - left.weeklyMinutes)
}

function buildPurposeMetrics(meetings: MeetingRecord[]): PurposeMetric[] {
  return [...groupMetrics(meetings, (meeting) => meeting.primary_purpose).entries()]
    .map(([purpose, value]) => ({
      purpose,
      ...value,
    }))
    .sort(
      (left, right) => right.weeklyAttendeeMinutes - left.weeklyAttendeeMinutes
    )
}

function buildClientMetrics(meetings: MeetingRecord[]): ClientMetric[] {
  return [...groupMetrics(meetings, (meeting) => meeting.clientLabel).entries()]
    .map(([client, value]) => ({
      client,
      ...value,
    }))
    .sort(
      (left, right) => right.weeklyAttendeeMinutes - left.weeklyAttendeeMinutes
    )
}

function buildClientMix(meetings: MeetingRecord[]): ClientMetric[] {
  const totals = new Map<string, ClientMetric>([
    [
      "Client-facing",
      { client: "Client-facing", meetingCount: 0, weeklyAttendeeMinutes: 0 },
    ],
    ["Internal", { client: "Internal", meetingCount: 0, weeklyAttendeeMinutes: 0 }],
  ])

  for (const meeting of meetings) {
    const key = meeting.isInternal ? "Internal" : "Client-facing"
    const current = totals.get(key)
    if (!current) continue
    current.meetingCount += 1
    current.weeklyAttendeeMinutes += meeting.weeklyWeightedAttendeeMinutes
  }

  return [...totals.values()]
}

function buildQualityNotes(meetings: MeetingRecord[]): QualityNote[] {
  const notes = new Map<string, QualityNote>()

  for (const meeting of meetings) {
    for (const note of meeting.dataNotes) {
      const label = note.includes("No weekday")
        ? "Unmapped cadence"
        : note.includes("Week 1/Week 2 assignment")
          ? "Unassigned biweekly"
          : note.includes("Approximate duration")
            ? "Approximate duration"
            : "Source note"

      const detail = `${meeting.meeting_name} (${meeting.owner_name}): ${note}`
      notes.set(detail, { label, detail })
    }
  }

  return [...notes.values()]
}

function buildKpis(
  meetings: MeetingRecord[],
  heatCells: HeatCellMetric[],
  busiestWeekday: Weekday | null
): KpiMetric[] {
  const totalWeeklyAttendeeMinutes = meetings.reduce(
    (sum, meeting) => sum + meeting.weeklyWeightedAttendeeMinutes,
    0
  )
  const totalWeeklyAttendeeHours = totalWeeklyAttendeeMinutes / 60
  const averageAttendees =
    meetings.reduce((sum, meeting) => sum + meeting.attendeeCount, 0) /
    Math.max(meetings.length, 1)
  const busiestCell = [...heatCells].sort((left, right) => right.weight - left.weight)[0]

  return [
    {
      label: "Meetings captured",
      value: meetings.length.toString(),
      detail: `${new Set(meetings.map((meeting) => meeting.owner_name)).size} unique owners`,
    },
    {
      label: "Weekly attendee load",
      value: formatHours(totalWeeklyAttendeeHours),
      detail: "Cadence-adjusted across every listed occurrence",
    },
    {
      label: "Average room size",
      value: `${averageAttendees.toFixed(1)} people`,
      detail: "Average attendees per recurring meeting",
    },
    {
      label: "Busiest weekday",
      value: busiestWeekday ?? "Unmapped",
      detail: busiestCell
        ? `${busiestCell.bucketLabel} is the heaviest 2-hour window`
        : "No weekday buckets available",
    },
  ]
}

export function createReportSummary(
  meetings: MeetingRecord[],
  options: ReportSummaryOptions = {}
): ReportSummary {
  const heatCells = buildHeatCells(meetings)
  const weekdayTotals = new Map<Weekday, number>()
  const costPerPersonHourUsd =
    options.costPerPersonHourUsd ?? DEFAULT_COST_PER_PERSON_HOUR_USD
  const totalWeeklyAttendeeMinutes = meetings.reduce(
    (sum, meeting) => sum + meeting.weeklyWeightedAttendeeMinutes,
    0
  )
  const weeklyMeetingCost = (totalWeeklyAttendeeMinutes / 60) * costPerPersonHourUsd

  for (const cell of heatCells) {
    weekdayTotals.set(cell.weekday, (weekdayTotals.get(cell.weekday) ?? 0) + cell.weight)
  }

  const busiestWeekday =
    [...weekdayTotals.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? null

  return {
    meetings,
    heatCells,
    ownerMetrics: buildOwnerMetrics(meetings),
    personMetrics: buildPersonMetrics(meetings),
    purposeMetrics: buildPurposeMetrics(meetings),
    clientMetrics: buildClientMetrics(meetings),
    clientMixMetrics: buildClientMix(meetings),
    busiestWeekday,
    qualityNotes: buildQualityNotes(meetings),
    kpis: buildKpis(meetings, heatCells, busiestWeekday),
    totalWeeklyAttendeeMinutes,
    costPerPersonHourUsd,
    weeklyMeetingCost,
    weeklyMeetingCostLabel: formatCurrency(weeklyMeetingCost),
  }
}

export function formatHoursFromMinutes(minutes: number) {
  return `${(minutes / 60).toFixed(1)}h`
}

export function formatMetricMinutes(minutes: number) {
  return `${Math.round(minutes).toLocaleString()} min`
}
