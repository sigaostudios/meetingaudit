"use client"

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import {
  createProposalScenario,
  ensureSeedDataset,
  getBaselineDecisions,
  getBaselineScenario,
  getEffectiveScenarioMeetings,
  getReplacementLinks,
  getScenarioAssumptions,
  getScenarioMeetings,
  listScenarios,
  removeScenarioMeeting,
  restoreBaselineScenarioFromSource,
  setBaselineDecision,
  setProposalMeetingReplacementLinks,
  upsertScenarioMeeting,
  type UpsertScenarioMeetingInput,
} from "@/lib/db/repositories"
import { createReportSummary, normalizeMeetingRows } from "@/lib/reporting"
import type { CsvMeetingRow } from "@/types/report"
import type {
  BaselineDecision,
  BaselineDecisionType,
  DashboardDataState,
  ReplacementLink,
  ScenarioChangeType,
  ScenarioKind,
  ScenarioMeetingRow,
} from "@/types/planning"

type SaveProposalMeetingInput = Omit<UpsertScenarioMeetingInput, "scenarioId" | "rowOrder"> & {
  rowOrder?: number
  baselineMeetingIds: number[]
}

type DashboardDataContextValue = DashboardDataState & {
  setActiveScenarioId: (scenarioId: number) => void
  createProposalVersion: (name: string, kind?: Extract<ScenarioKind, "to_be" | "option">) => Promise<void>
  setBaselineMeetingDecision: (
    baselineMeetingId: number,
    decision: BaselineDecisionType
  ) => Promise<void>
  saveScenarioMeeting: (input: SaveProposalMeetingInput) => Promise<number>
  deleteScenarioMeeting: (meetingId: number) => Promise<void>
  restoreBaselineSchedule: () => Promise<void>
  refresh: () => void
}

type DashboardDataProviderProps = {
  seedCsv: string
  seedChecksum: string
  children: ReactNode
}

const DashboardDataContext = createContext<DashboardDataContextValue | null>(null)

function getCostPerPersonHourUsd(assumptions: DashboardDataState["assumptions"]) {
  const value = assumptions.find(
    (assumption) =>
      assumption.category === "cost" && assumption.key === "per_person_hour_usd"
  )?.valueNumber

  return value ?? 100
}

function toCsvMeetingRows(meetings: ScenarioMeetingRow[]): CsvMeetingRow[] {
  return meetings
    .filter((meeting) => meeting.changeType !== "removed")
    .map((meeting) => ({
      submission_date: meeting.submission_date,
      owner_name: meeting.owner_name,
      meeting_name: meeting.meeting_name,
      time: meeting.time,
      frequency: meeting.frequency,
      duration: meeting.duration,
      primary_purpose: meeting.primary_purpose,
      attendees: meeting.attendees,
      client_if_applicable: meeting.client_if_applicable,
      notes: meeting.notes,
      source_excel_row: meeting.source_excel_row,
    }))
}

function compareReports(
  baseline: DashboardDataState["baselineReport"],
  proposal: DashboardDataState["report"]
): DashboardDataState["comparison"] {
  if (!baseline || !proposal) {
    return null
  }

  return {
    meetingDelta: proposal.meetings.length - baseline.meetings.length,
    attendeeMinuteDelta:
      proposal.totalWeeklyAttendeeMinutes - baseline.totalWeeklyAttendeeMinutes,
    weeklyCostDelta: proposal.weeklyMeetingCost - baseline.weeklyMeetingCost,
  }
}

const initialState: DashboardDataState = {
  status: "idle",
  dataset: null,
  scenarios: [],
  baselineScenarioId: null,
  activeScenarioId: null,
  report: null,
  baselineReport: null,
  comparison: null,
  assumptions: [],
  baselineMeetings: [],
  proposalMeetings: [],
  effectiveMeetings: [],
  baselineDecisions: [],
  replacementLinks: [],
  errorMessage: null,
}

export function DashboardDataProvider({
  seedCsv,
  seedChecksum,
  children,
}: DashboardDataProviderProps) {
  const [state, setState] = useState<DashboardDataState>(initialState)
  const [activeScenarioId, setActiveScenarioId] = useState<number | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setState((current) => ({
        ...current,
        status: current.report ? "ready" : "loading",
        errorMessage: null,
      }))

      try {
        const dataset = await ensureSeedDataset(seedCsv, seedChecksum)
        const scenarios = await listScenarios(dataset.id)
        const baselineScenario = await getBaselineScenario(dataset.id)
        const selectedScenarioId =
          activeScenarioId && scenarios.some((scenario) => scenario.id === activeScenarioId)
            ? activeScenarioId
            : baselineScenario.id
        const selectedScenario =
          scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? baselineScenario

        const [baselineMeetings, baselineAssumptions] = await Promise.all([
          getScenarioMeetings(baselineScenario.id),
          getScenarioAssumptions(baselineScenario.id),
        ])

        const baselineReport = createReportSummary(
          normalizeMeetingRows(toCsvMeetingRows(baselineMeetings)),
          {
            costPerPersonHourUsd: getCostPerPersonHourUsd(baselineAssumptions),
          }
        )

        let effectiveMeetings: ScenarioMeetingRow[] = baselineMeetings
        let proposalMeetings: ScenarioMeetingRow[] = []
        let baselineDecisions: BaselineDecision[] = []
        let replacementLinks: ReplacementLink[] = []
        let assumptions = baselineAssumptions

        if (selectedScenario.kind !== "baseline") {
          ;[effectiveMeetings, proposalMeetings, baselineDecisions, replacementLinks, assumptions] =
            await Promise.all([
              getEffectiveScenarioMeetings(selectedScenario.id),
              getScenarioMeetings(selectedScenario.id),
              getBaselineDecisions(selectedScenario.id),
              getReplacementLinks(selectedScenario.id),
              getScenarioAssumptions(selectedScenario.id),
            ])
        }

        const report = createReportSummary(
          normalizeMeetingRows(toCsvMeetingRows(effectiveMeetings)),
          {
            costPerPersonHourUsd: getCostPerPersonHourUsd(assumptions),
          }
        )

        if (cancelled) {
          return
        }

        startTransition(() => {
          setActiveScenarioId(selectedScenario.id)
          setState({
            status: "ready",
            dataset,
            scenarios,
            baselineScenarioId: baselineScenario.id,
            activeScenarioId: selectedScenario.id,
            report,
            baselineReport,
            comparison: compareReports(baselineReport, report),
            assumptions,
            baselineMeetings,
            proposalMeetings,
            effectiveMeetings,
            baselineDecisions,
            replacementLinks,
            errorMessage: null,
          })
        })
      } catch (error) {
        if (cancelled) {
          return
        }

        const message =
          error instanceof Error ? error.message : "Unknown scenario load failure"

        setState((current) => ({
          ...current,
          status: "error",
          errorMessage: message,
        }))
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [activeScenarioId, refreshKey, seedChecksum, seedCsv])

  const value = useMemo<DashboardDataContextValue>(
    () => ({
      ...state,
      setActiveScenarioId,
      refresh: () => setRefreshKey((current) => current + 1),
      createProposalVersion: async (name, kind) => {
        if (!state.dataset) {
          throw new Error("Dataset is not available.")
        }

        const proposalKind: Extract<ScenarioKind, "to_be" | "option"> =
          kind ??
          (state.scenarios.some((scenario) => scenario.kind === "to_be") ? "option" : "to_be")

        const created = await createProposalScenario({
          datasetId: state.dataset.id,
          name,
          kind: proposalKind,
        })
        setActiveScenarioId(created.id)
        setRefreshKey((current) => current + 1)
      },
      setBaselineMeetingDecision: async (baselineMeetingId, decision) => {
        const scenarioId = state.activeScenarioId
        if (!scenarioId || scenarioId === state.baselineScenarioId) {
          throw new Error("Select a proposal version before editing baseline decisions.")
        }

        await setBaselineDecision(scenarioId, baselineMeetingId, decision)
        setRefreshKey((current) => current + 1)
      },
      saveScenarioMeeting: async (input) => {
        const scenarioId = state.activeScenarioId
        if (!scenarioId) {
          throw new Error("Select a scenario before editing meetings.")
        }

        const isBaselineScenario = scenarioId === state.baselineScenarioId
        const rowOrder =
          input.rowOrder ??
          Math.max(
            ...(isBaselineScenario
              ? state.baselineMeetings.map((meeting) => meeting.rowOrder)
              : [
                  ...state.proposalMeetings.map((meeting) => meeting.rowOrder),
                  ...state.baselineMeetings.map((meeting) => meeting.rowOrder),
                ]),
            0
          ) + 1

        const saved = await upsertScenarioMeeting({
          ...input,
          scenarioId,
          rowOrder,
          changeType:
            input.changeType ??
            (input.id ? "updated" : ("added" satisfies ScenarioChangeType)),
        })
        await setProposalMeetingReplacementLinks(scenarioId, saved.id, input.baselineMeetingIds)
        setRefreshKey((current) => current + 1)
        return saved.id
      },
      deleteScenarioMeeting: async (meetingId) => {
        const scenarioId = state.activeScenarioId
        if (!scenarioId) {
          throw new Error("Select a scenario before deleting meetings.")
        }

        await setProposalMeetingReplacementLinks(scenarioId, meetingId, [])
        await removeScenarioMeeting(meetingId)
        setRefreshKey((current) => current + 1)
      },
      restoreBaselineSchedule: async () => {
        const scenarioId = state.activeScenarioId
        if (!scenarioId || scenarioId !== state.baselineScenarioId) {
          throw new Error("Select the As-is scenario before restoring from the CSV.")
        }

        await restoreBaselineScenarioFromSource(scenarioId)
        setRefreshKey((current) => current + 1)
      },
    }),
    [state]
  )

  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  )
}

export function useDashboardData() {
  const value = useContext(DashboardDataContext)

  if (!value) {
    throw new Error("useDashboardData must be used within DashboardDataProvider.")
  }

  return value
}
