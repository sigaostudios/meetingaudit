import type { ReportSummary } from "@/types/report"

export type ScenarioKind = "baseline" | "to_be" | "option"

export type ScenarioStatus = "draft" | "active" | "archived"

export type ScenarioChangeType = "seed" | "added" | "updated" | "removed"

export type ScenarioAssumptionValueType = "number" | "text" | "json"

export type AppMode = "dashboard" | "schedule"

export type BaselineDecisionType = "continue" | "cancel" | "change"

export interface Dataset {
  id: number
  name: string
  sourceFilename: string
  sourceChecksum: string
  importedAt: string
  createdAt: string
}

export interface Scenario {
  id: number
  datasetId: number
  parentScenarioId: number | null
  name: string
  kind: ScenarioKind
  description: string | null
  status: ScenarioStatus
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface ScenarioMeetingRow {
  id: number
  scenarioId: number
  sourceMeetingId: number | null
  rowOrder: number
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
  changeType: ScenarioChangeType
  createdAt: string
  updatedAt: string
}

export interface ScenarioAssumption {
  id: number
  scenarioId: number
  category: string
  key: string
  valueType: ScenarioAssumptionValueType
  valueNumber: number | null
  valueText: string | null
  valueJson: unknown
  unit: string | null
  createdAt: string
  updatedAt: string
}

export interface BaselineDecision {
  id: number
  scenarioId: number
  baselineMeetingId: number
  decision: BaselineDecisionType
  createdAt: string
  updatedAt: string
}

export interface ReplacementLink {
  id: number
  scenarioId: number
  proposalMeetingId: number
  baselineMeetingId: number
  createdAt: string
}

export interface ReportComparison {
  meetingDelta: number
  attendeeMinuteDelta: number
  weeklyCostDelta: number
}

export interface DashboardDataState {
  status: "idle" | "loading" | "ready" | "error"
  dataset: Dataset | null
  scenarios: Scenario[]
  baselineScenarioId: number | null
  activeScenarioId: number | null
  report: ReportSummary | null
  baselineReport: ReportSummary | null
  comparison: ReportComparison | null
  assumptions: ScenarioAssumption[]
  baselineMeetings: ScenarioMeetingRow[]
  proposalMeetings: ScenarioMeetingRow[]
  effectiveMeetings: ScenarioMeetingRow[]
  baselineDecisions: BaselineDecision[]
  replacementLinks: ReplacementLink[]
  errorMessage: string | null
}
