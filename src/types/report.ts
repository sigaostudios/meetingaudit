export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
] as const

export type Weekday = (typeof WEEKDAYS)[number]

export const TIME_BUCKETS = [
  "00:00-01:59",
  "02:00-03:59",
  "04:00-05:59",
  "06:00-07:59",
  "08:00-09:59",
  "10:00-11:59",
  "12:00-13:59",
  "14:00-15:59",
  "16:00-17:59",
  "18:00-19:59",
  "20:00-21:59",
  "22:00-23:59",
] as const

export type TimeBucketLabel = (typeof TIME_BUCKETS)[number]

export type Cadence = "Weekly" | "Biweekly" | "Monthly" | "Unspecified"

export interface CsvMeetingRow {
  submission_date: string
  owner_name: string
  meeting_name: string
  time: string
  frequency: string
  duration: string
  primary_purpose: string
  attendees: string
  client_if_applicable: string
  notes: string
  source_excel_row: string
}

export interface MeetingRecord extends CsvMeetingRow {
  attendeeList: string[]
  attendeeCount: number
  weekdays: Weekday[]
  cadence: Cadence
  cadenceFactor: number
  durationMinutes: number
  approximateDuration: boolean
  startMinutes: number
  startHour: number
  timeBucketIndex: number
  timeBucketLabel: TimeBucketLabel
  clientLabel: string
  isInternal: boolean
  weeklyOccurrenceCount: number
  weeklyWeightedMinutes: number
  weeklyWeightedAttendeeMinutes: number
  perOccurrenceWeightedAttendeeMinutes: number
  dataNotes: string[]
}

export interface KpiMetric {
  label: string
  value: string
  detail: string
}

export interface HeatCellMetric {
  date: string
  weekday: Weekday
  bucketIndex: number
  bucketLabel: TimeBucketLabel
  weight: number
  meetingCount: number
}

export interface OwnerMetric {
  ownerName: string
  meetingCount: number
  weeklyMinutes: number
  weeklyAttendeeMinutes: number
}

export interface PurposeMetric {
  purpose: string
  meetingCount: number
  weeklyAttendeeMinutes: number
}

export interface ClientMetric {
  client: string
  meetingCount: number
  weeklyAttendeeMinutes: number
}

export interface PersonBreakdownMetric {
  label: string
  weeklyMinutes: number
}

export interface PersonDayMetric {
  weekday: Weekday
  weeklyMinutes: number
}

export interface PersonMetric {
  name: string
  meetingCount: number
  weeklyMinutes: number
  busiestWeekday: Weekday | null
  busiestBucketLabel: TimeBucketLabel | null
  busiestSlotMinutes: number
  clientBreakdown: PersonBreakdownMetric[]
  purposeBreakdown: PersonBreakdownMetric[]
  weekdayBreakdown: PersonDayMetric[]
}

export interface QualityNote {
  label: string
  detail: string
}

export interface ReportSummaryOptions {
  costPerPersonHourUsd?: number
}

export interface ReportSummary {
  meetings: MeetingRecord[]
  kpis: KpiMetric[]
  heatCells: HeatCellMetric[]
  ownerMetrics: OwnerMetric[]
  personMetrics: PersonMetric[]
  purposeMetrics: PurposeMetric[]
  clientMetrics: ClientMetric[]
  clientMixMetrics: ClientMetric[]
  busiestWeekday: Weekday | null
  qualityNotes: QualityNote[]
  totalWeeklyAttendeeMinutes: number
  costPerPersonHourUsd: number
  weeklyMeetingCost: number
  weeklyMeetingCostLabel: string
}
