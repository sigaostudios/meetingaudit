import { Fragment, startTransition, useEffect, useState, type CSSProperties } from "react"

import { dashboardBlockRenderers } from "@/components/report/dashboard-block-registry"
import {
  HeroBlock,
  TopBarBlock,
} from "@/components/report/dashboard-blocks"
import { ReportSidebar } from "@/components/report/report-sidebar"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { loadDashboardContent } from "@/lib/dashboard-content"
import { loadReportSummary } from "@/lib/reporting"
import type {
  DashboardContent,
  SummaryDrilldownKey,
} from "@/types/dashboard"
import type { ReportSummary } from "@/types/report"

function App() {
  const [report, setReport] = useState<ReportSummary | null>(null)
  const [dashboardContent, setDashboardContent] = useState<DashboardContent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedSummaryDrilldown, setSelectedSummaryDrilldown] =
    useState<SummaryDrilldownKey>("highFrequency")
  const [selectedPersonName, setSelectedPersonName] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
  )

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode)
  }, [darkMode])

  useEffect(() => {
    let cancelled = false

    Promise.all([loadReportSummary(), loadDashboardContent()])
      .then(([summary, content]) => {
        if (cancelled) return
        startTransition(() => {
          setReport(summary)
          setDashboardContent(content)
        })
      })
      .catch((reason: unknown) => {
        if (cancelled) return
        setError(reason instanceof Error ? reason.message : "Unknown load failure")
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-20">
        <Card className="report-card w-full rounded-[1.75rem] border border-destructive/30">
          <CardHeader>
            <CardTitle>Unable to load the report data</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </main>
    )
  }

  if (!report || !dashboardContent) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-20">
        <Card className="report-card w-full rounded-[1.75rem]">
          <CardHeader>
            <Badge className="w-fit rounded-full border-none bg-primary/10 text-primary">
              Loading report
            </Badge>
            <CardTitle>Building the meeting audit dashboard</CardTitle>
            <CardDescription>
              Parsing the normalized CSV and shaping the summary metrics.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    )
  }

  const topClient = report.clientMetrics.find((metric) => metric.client !== "Internal")
  return (
    <SidebarProvider
      defaultOpen
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 76)",
          "--sidebar-width-icon": "calc(var(--spacing) * 14)",
          "--header-height": "calc(var(--spacing) * 14)",
        } as CSSProperties
      }
    >
      <ReportSidebar
        topClient={topClient}
        noteCount={report.qualityNotes.length}
        weeklyMeetingCostLabel={report.weeklyMeetingCostLabel}
        content={dashboardContent.sidebar}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode((value) => !value)}
      />

      <SidebarInset className="report-main min-h-svh bg-transparent">
        <TopBarBlock content={dashboardContent} />

        <div className="@container/main flex flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-[1480px] min-w-0 flex-1 flex-col gap-6 px-4 pb-10 pt-4 sm:px-6 lg:px-8">
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
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default App
