import {
  ClientLoadBlock,
  DirectoryBlock,
  OverviewBlock,
  OwnerLoadBlock,
  PersonBreakdownBlock,
  PersonLoadBlock,
  PortfolioBlock,
  QualityNotesBlock,
  ScheduleBlock,
  WorkloadSummaryBlock,
  type BlockRenderer,
} from "@/components/report/dashboard-blocks"
import type { DashboardWidgetKey } from "@/types/dashboard"

export const dashboardBlockRenderers: Record<DashboardWidgetKey, BlockRenderer> = {
  overview: OverviewBlock,
  schedule: ScheduleBlock,
  ownerLoad: OwnerLoadBlock,
  workloadSummary: WorkloadSummaryBlock,
  personLoad: PersonLoadBlock,
  personBreakdown: PersonBreakdownBlock,
  portfolio: PortfolioBlock,
  qualityNotes: QualityNotesBlock,
  clientLoad: ClientLoadBlock,
  directory: DirectoryBlock,
}
