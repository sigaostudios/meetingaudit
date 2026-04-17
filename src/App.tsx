"use client"

import { Fragment, useEffect, useState, type CSSProperties } from "react"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { DashboardDataProvider, useDashboardData } from "@/components/report/dashboard-data-provider"
import { dashboardBlockRenderers } from "@/components/report/dashboard-block-registry"
import { HeroBlock, TopBarBlock } from "@/components/report/dashboard-blocks"
import { ScheduleBuilder } from "@/components/schedule/schedule-builder"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { formatHoursFromMinutes } from "@/lib/reporting"
import type { DashboardContent, SummaryDrilldownKey } from "@/types/dashboard"
import type { AppMode, BaselineDecisionType } from "@/types/planning"

type AppProps = {
  seedCsv: string
  seedChecksum: string
  dashboardContent: DashboardContent
}

function DashboardShell({ dashboardContent }: { dashboardContent: DashboardContent }) {
  const {
    activeScenarioId,
    baselineScenarioId,
    baselineMeetings,
    baselineDecisions,
    comparison,
    createProposalVersion,
    deleteScenarioMeeting,
    errorMessage,
    proposalMeetings,
    replacementLinks,
    report,
    restoreBaselineSchedule,
    scenarios,
    setActiveScenarioId,
    setBaselineMeetingDecision,
    saveScenarioMeeting,
    status,
  } = useDashboardData()
  const [selectedSummaryDrilldown, setSelectedSummaryDrilldown] =
    useState<SummaryDrilldownKey>("highFrequency")
  const [selectedPersonName, setSelectedPersonName] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
  )
  const [appMode, setAppMode] = useState<AppMode>("dashboard")

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode)
  }, [darkMode])

  if (status === "error") {
    return <DashboardErrorState message={errorMessage ?? "Unknown load failure"} />
  }

  if (!report || status !== "ready") {
    return <DashboardLoadingState />
  }

  return (
    <DashboardReadyState
      dashboardContent={dashboardContent}
      report={report}
      activeScenarioId={activeScenarioId}
      baselineScenarioId={baselineScenarioId}
      baselineMeetings={baselineMeetings}
      baselineDecisions={baselineDecisions}
      comparison={comparison}
      createProposalVersion={createProposalVersion}
      deleteScenarioMeeting={deleteScenarioMeeting}
      proposalMeetings={proposalMeetings}
      replacementLinks={replacementLinks}
      restoreBaselineSchedule={restoreBaselineSchedule}
      scenarios={scenarios}
      setActiveScenarioId={setActiveScenarioId}
      setBaselineMeetingDecision={setBaselineMeetingDecision}
      saveScenarioMeeting={saveScenarioMeeting}
      selectedSummaryDrilldown={selectedSummaryDrilldown}
      setSelectedSummaryDrilldown={setSelectedSummaryDrilldown}
      selectedPersonName={selectedPersonName}
      setSelectedPersonName={setSelectedPersonName}
      darkMode={darkMode}
      onToggleTheme={() => setDarkMode((value) => !value)}
      appMode={appMode}
      setAppMode={setAppMode}
    />
  )
}

function DashboardErrorState({ message }: { message: string }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-20">
      <Card className="report-card w-full rounded-[1.1rem] border border-destructive/30">
        <CardHeader>
          <CardTitle>Unable to load the report data</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
      </Card>
    </main>
  )
}

function DashboardLoadingState() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-20">
      <Card className="report-card w-full rounded-[1.1rem]">
        <CardHeader>
          <Badge className="w-fit rounded-full border-none bg-primary/10 text-primary">
            Loading report
          </Badge>
          <CardTitle>Building the meeting audit dashboard</CardTitle>
          <CardDescription>
            Initializing the planning store and shaping the active scenario metrics.
          </CardDescription>
        </CardHeader>
      </Card>
    </main>
  )
}

function DashboardReadyState({
  dashboardContent,
  report,
  activeScenarioId,
  baselineScenarioId,
  baselineMeetings,
  baselineDecisions,
  comparison,
  createProposalVersion,
  deleteScenarioMeeting,
  proposalMeetings,
  replacementLinks,
  restoreBaselineSchedule,
  scenarios,
  setActiveScenarioId,
  setBaselineMeetingDecision,
  saveScenarioMeeting,
  selectedSummaryDrilldown,
  setSelectedSummaryDrilldown,
  selectedPersonName,
  setSelectedPersonName,
  darkMode,
  onToggleTheme,
  appMode,
  setAppMode,
}: {
  dashboardContent: DashboardContent
  report: NonNullable<ReturnType<typeof useDashboardData>["report"]>
  activeScenarioId: number | null
  baselineScenarioId: number | null
  baselineMeetings: ReturnType<typeof useDashboardData>["baselineMeetings"]
  baselineDecisions: ReturnType<typeof useDashboardData>["baselineDecisions"]
  comparison: ReturnType<typeof useDashboardData>["comparison"]
  createProposalVersion: ReturnType<typeof useDashboardData>["createProposalVersion"]
  deleteScenarioMeeting: ReturnType<typeof useDashboardData>["deleteScenarioMeeting"]
  proposalMeetings: ReturnType<typeof useDashboardData>["proposalMeetings"]
  replacementLinks: ReturnType<typeof useDashboardData>["replacementLinks"]
  restoreBaselineSchedule: ReturnType<typeof useDashboardData>["restoreBaselineSchedule"]
  scenarios: ReturnType<typeof useDashboardData>["scenarios"]
  setActiveScenarioId: ReturnType<typeof useDashboardData>["setActiveScenarioId"]
  setBaselineMeetingDecision: ReturnType<typeof useDashboardData>["setBaselineMeetingDecision"]
  saveScenarioMeeting: ReturnType<typeof useDashboardData>["saveScenarioMeeting"]
  selectedSummaryDrilldown: SummaryDrilldownKey
  setSelectedSummaryDrilldown: (value: SummaryDrilldownKey) => void
  selectedPersonName: string | null
  setSelectedPersonName: (value: string | null) => void
  darkMode: boolean
  onToggleTheme: () => void
  appMode: AppMode
  setAppMode: (value: AppMode) => void
}) {
  const decisionByBaselineId = new Map(
    baselineDecisions.map((decision) => [decision.baselineMeetingId, decision.decision])
  )
  const isProposalSelected =
    activeScenarioId !== null &&
    baselineScenarioId !== null &&
    activeScenarioId !== baselineScenarioId
  const activeScenario = scenarios.find((scenario) => scenario.id === activeScenarioId) ?? null
  const [newVersionName, setNewVersionName] = useState("")
  const [creatingVersion, setCreatingVersion] = useState(false)
  const [createVersionDialogOpen, setCreateVersionDialogOpen] = useState(false)

  const handleCreateVersion = async () => {
    const name = newVersionName.trim()
    if (!name) {
      return
    }

    setCreatingVersion(true)
    try {
      await createProposalVersion(name)
      setNewVersionName("")
      setCreateVersionDialogOpen(false)
    } finally {
      setCreatingVersion(false)
    }
  }

  return (
    <TooltipProvider>
      <SidebarProvider
        defaultOpen
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--sidebar-width-icon": "calc(var(--spacing) * 14)",
            "--header-height": "calc(var(--spacing) * 14)",
          } as CSSProperties
        }
      >
        <AppSidebar
          appMode={appMode}
          onModeChange={setAppMode}
          scenarios={scenarios}
          activeScenarioId={activeScenarioId}
          onScenarioChange={setActiveScenarioId}
          darkMode={darkMode}
          onToggleTheme={onToggleTheme}
        />

        <SidebarInset className="report-main min-h-svh bg-transparent">
          <TopBarBlock
            appMode={appMode}
            activeScenario={activeScenario}
            activeScenarioId={activeScenarioId}
            scenarios={scenarios}
            onModeChange={setAppMode}
            onScenarioChange={setActiveScenarioId}
            onOpenCreateVersion={() => setCreateVersionDialogOpen(true)}
          />

          <Dialog
            open={createVersionDialogOpen}
            onOpenChange={(open) => {
              setCreateVersionDialogOpen(open)
              if (!open && !creatingVersion) {
                setNewVersionName("")
              }
            }}
          >
            <DialogContent className="rounded-[1rem] p-0 sm:max-w-md">
              <DialogHeader className="px-6 pt-6">
                <DialogTitle>Create proposal version</DialogTitle>
                <DialogDescription>
                  Name the new scenario version you want to model.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  void handleCreateVersion()
                }}
                className="grid gap-4 px-6 pb-6 pt-2"
              >
                <Input
                  value={newVersionName}
                  onChange={(event) => setNewVersionName(event.target.value)}
                  placeholder="Q3 sprint option"
                  autoFocus
                />
                <DialogFooter className="mx-0 mb-0 rounded-b-none border-t px-0 pb-0 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateVersionDialogOpen(false)}
                    disabled={creatingVersion}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creatingVersion || !newVersionName.trim()}>
                    Create
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <div className="@container/main flex flex-1 flex-col">
            <div
              className={
                appMode === "schedule"
                  ? "flex w-full min-w-0 flex-1 flex-col gap-6 px-0 pb-0 pt-4"
                  : "mx-auto flex w-full max-w-[1480px] min-w-0 flex-1 flex-col gap-6 px-4 pb-10 pt-4 sm:px-6 lg:px-8"
              }
            >
              {appMode === "dashboard" && isProposalSelected && comparison ? (
                <Card className="report-card rounded-[1rem]">
                  <CardHeader className="gap-3">
                    <CardTitle className="text-lg">
                      {activeScenario?.name ?? "Proposal"} vs As-is
                    </CardTitle>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <DeltaTile
                        label="Meeting count"
                        value={comparison.meetingDelta.toString()}
                        detail={`${report.meetings.length} total in active version`}
                      />
                      <DeltaTile
                        label="Weekly attendee load"
                        value={formatHoursFromMinutes(comparison.attendeeMinuteDelta)}
                        detail={`${formatHoursFromMinutes(report.totalWeeklyAttendeeMinutes)} total`}
                      />
                      <DeltaTile
                        label="Estimated weekly cost"
                        value={new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                          maximumFractionDigits: 0,
                          signDisplay: "always",
                        }).format(comparison.weeklyCostDelta)}
                        detail={report.weeklyMeetingCostLabel}
                      />
                    </div>
                  </CardHeader>
                </Card>
              ) : null}

              {appMode === "dashboard" ? (
                <>
                  <HeroBlock data={report} content={dashboardContent} />

                  <div className="grid min-w-0 gap-6 xl:grid-cols-12">
                    {dashboardContent.widgetOrder.map((widgetKey) => {
                      const renderer = dashboardBlockRenderers[widgetKey]
                      const widget = dashboardContent.widgets[widgetKey]

                      return (
                        <Fragment key={widgetKey}>
                          {renderer({
                            widget,
                            data: report,
                            content: dashboardContent,
                            selectedSummaryDrilldown,
                            setSelectedSummaryDrilldown,
                            selectedPersonName,
                            setSelectedPersonName,
                          })}
                        </Fragment>
                      )
                    })}
                  </div>
                </>
              ) : (
                <ScheduleBuilder
                  activeScenarioId={activeScenarioId}
                  baselineScenarioId={baselineScenarioId}
                  baselineMeetings={baselineMeetings}
                  proposalMeetings={proposalMeetings}
                  entityColors={dashboardContent.entityColors}
                  replacementLinks={replacementLinks}
                  decisionByBaselineId={decisionByBaselineId}
                  onSetDecision={(baselineMeetingId, decision) =>
                    setBaselineMeetingDecision(
                      baselineMeetingId,
                      decision as BaselineDecisionType
                    )
                  }
                  onSaveMeeting={saveScenarioMeeting}
                  onDeleteMeeting={deleteScenarioMeeting}
                  onRestoreBaselineSchedule={restoreBaselineSchedule}
                />
              )}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}

function DeltaTile({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="report-metric-tile rounded-[1rem] border border-border/60 bg-background/70 px-4 py-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-[1.75rem] font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  )
}

function App({ seedCsv, seedChecksum, dashboardContent }: AppProps) {
  return (
    <DashboardDataProvider seedCsv={seedCsv} seedChecksum={seedChecksum}>
      <DashboardShell dashboardContent={dashboardContent} />
    </DashboardDataProvider>
  )
}

export default App
