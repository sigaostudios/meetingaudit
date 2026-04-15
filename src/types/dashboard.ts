export type DashboardWidgetKey =
  | "overview"
  | "schedule"
  | "ownerLoad"
  | "workloadSummary"
  | "personLoad"
  | "personBreakdown"
  | "portfolio"
  | "qualityNotes"
  | "clientLoad"
  | "directory"

export type SummaryDrilldownKey =
  | "highFrequency"
  | "meetingsWithNotes"
  | "largestClientFootprint"

export type DashboardWidgetSpan = "full" | "wide" | "narrow" | "half"

export interface DashboardWidgetDefinition {
  id: DashboardWidgetKey
  title: string
  description: string
  tooltip: string
  colSpan: DashboardWidgetSpan
  anchorId?: string
}

export interface DashboardActionContent {
  label: string
  href: string
}

export interface DashboardLabeledTooltip {
  label: string
  tooltip: string
}

export interface DashboardSidebarSignalContent extends DashboardLabeledTooltip {
  detail: string
}

export interface DashboardEntityColors {
  clients: Record<string, string>
  people: Record<string, string>
}

export interface DashboardContent {
  topBar: {
    eyebrow: string
    title: string
    badge: string
  }
  sidebar: {
    badge: string
    eyebrow: string
    title: string
    signals: {
      weeklyCost: DashboardSidebarSignalContent
      topClientLoad: DashboardSidebarSignalContent
      sourceNotes: DashboardSidebarSignalContent
    }
  }
  hero: {
    eyebrow: string
    title: string
    description: string
    primaryAction: DashboardActionContent
    secondaryAction: DashboardActionContent
    summaryLabel: string
    summaryTooltip: string
    chips: {
      busiestDay: DashboardLabeledTooltip
      weeklyCost: DashboardLabeledTooltip
      mostExpensiveClient: DashboardLabeledTooltip
    }
  }
  entityColors: DashboardEntityColors
  widgetOrder: DashboardWidgetKey[]
  widgets: Record<DashboardWidgetKey, DashboardWidgetDefinition>
  kpiDefinitions: Record<string, string>
  workloadSummaryDefinitions: Record<string, string>
  personChipDefinitions: Record<string, string>
}
