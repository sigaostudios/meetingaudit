import {
  ActivityIcon,
  BarChart3Icon,
  Building2Icon,
  CalendarClockIcon,
  CircleHelpIcon,
  FileSpreadsheetIcon,
  UsersIcon,
  MoonStarIcon,
  SunMediumIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { DashboardContent } from "@/types/dashboard"
import type { ClientMetric } from "@/types/report"

type ReportSidebarProps = {
  topClient?: ClientMetric
  noteCount: number
  weeklyMeetingCostLabel: string
  content: DashboardContent["sidebar"]
  darkMode: boolean
  onToggleTheme: () => void
}

const sections = [
  { label: "Overview", href: "#overview", icon: ActivityIcon },
  { label: "Schedule load", href: "#schedule", icon: CalendarClockIcon },
  { label: "Summary detail", href: "#summary-detail", icon: BarChart3Icon },
  { label: "People time", href: "#people", icon: UsersIcon },
  { label: "Portfolio mix", href: "#portfolio", icon: Building2Icon },
  { label: "Quality notes", href: "#quality", icon: TriangleAlertIcon },
  { label: "Meeting directory", href: "#directory", icon: FileSpreadsheetIcon },
] as const

export function ReportSidebar({
  topClient,
  noteCount,
  weeklyMeetingCostLabel,
  content,
  darkMode,
  onToggleTheme,
}: ReportSidebarProps) {
  return (
    <Sidebar collapsible="icon" variant="inset" className="overflow-hidden">
      <SidebarHeader className="gap-4 overflow-hidden p-4 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-2">
        <div className="grid gap-2 group-data-[collapsible=icon]:justify-items-center">
          <Badge className="w-fit rounded-full border-none bg-sidebar-primary px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-sidebar-primary-foreground group-data-[collapsible=icon]:hidden">
            {content.badge}
          </Badge>
          <div className="hidden size-8 items-center justify-center rounded-full bg-sidebar-primary text-[11px] font-semibold uppercase tracking-[0.18em] text-sidebar-primary-foreground group-data-[collapsible=icon]:flex">
            MA
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-xs uppercase tracking-[0.24em] text-sidebar-foreground/55">
              {content.eyebrow}
            </p>
            <h1 className="font-heading text-2xl leading-tight tracking-[-0.03em] text-sidebar-foreground">
              {content.title}
            </h1>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigate</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sections.map((section) => (
                <SidebarMenuItem key={section.label}>
                  <SidebarMenuButton
                    tooltip={section.label}
                    render={<a href={section.href} />}
                  >
                    <section.icon />
                    <span>{section.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Signal</SidebarGroupLabel>
          <SidebarGroupContent className="grid gap-3 px-2 text-sm text-sidebar-foreground/78">
            <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/55 p-3">
              <SignalLabel
                label={content.signals.weeklyCost.label}
                definition={content.signals.weeklyCost.tooltip}
              />
              <p className="mt-2 font-heading text-xl text-sidebar-foreground">
                {weeklyMeetingCostLabel}
              </p>
              <p className="mt-1 text-xs text-sidebar-foreground/65">
                {content.signals.weeklyCost.detail}
              </p>
            </div>

            <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/55 p-3">
              <SignalLabel
                label={content.signals.topClientLoad.label}
                definition={content.signals.topClientLoad.tooltip}
              />
              <p className="mt-2 font-heading text-xl text-sidebar-foreground">
                {topClient?.client ?? "Internal"}
              </p>
              <p className="mt-1 text-xs text-sidebar-foreground/65">
                {topClient
                  ? `${Math.round(topClient.weeklyAttendeeMinutes).toLocaleString()} weighted attendee-minutes`
                  : content.signals.topClientLoad.detail}
              </p>
            </div>

            <div className="rounded-xl border border-sidebar-border/80 px-3 py-2">
              <SignalLabel
                label={content.signals.sourceNotes.label}
                definition={content.signals.sourceNotes.tooltip}
              />
              <p className="mt-1 text-lg font-semibold text-sidebar-foreground">
                {noteCount}
              </p>
              <p className="text-xs text-sidebar-foreground/65">
                {content.signals.sourceNotes.detail}
              </p>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="overflow-hidden p-4 group-data-[collapsible=icon]:px-2">
        <Button
          variant="secondary"
          className="w-full justify-between overflow-hidden rounded-full bg-sidebar-accent text-sidebar-accent-foreground shadow-none hover:bg-sidebar-accent/80 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-full group-data-[collapsible=icon]:px-0"
          onClick={onToggleTheme}
          title={darkMode ? "Switch to light canvas" : "Switch to dark canvas"}
        >
          <span className="group-data-[collapsible=icon]:hidden">
            {darkMode ? "Light canvas" : "Dark canvas"}
          </span>
          {darkMode ? <SunMediumIcon /> : <MoonStarIcon />}
        </Button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

function SignalLabel({
  label,
  definition,
}: {
  label: string
  definition: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-sidebar-foreground/55">
        {label}
      </p>
      <Tooltip>
        <TooltipTrigger className="inline-flex rounded-full text-sidebar-foreground/50 transition-colors hover:text-sidebar-foreground">
          <CircleHelpIcon className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent className="max-w-72 bg-foreground text-background">
          {definition}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
