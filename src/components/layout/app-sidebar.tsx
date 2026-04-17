"use client"

import { useCallback, useEffect, useState } from "react"
import {
  ActivityIcon,
  BarChart3Icon,
  Building2Icon,
  CalendarClockIcon,
  CalendarRangeIcon,
  ChevronsUpDownIcon,
  ChevronRightIcon,
  FileSpreadsheetIcon,
  LayoutDashboardIcon,
  MoonStarIcon,
  SunMediumIcon,
  TriangleAlertIcon,
  UsersIcon,
} from "lucide-react"

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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import type { AppMode, Scenario } from "@/types/planning"

type AppSidebarProps = {
  appMode: AppMode
  onModeChange: (value: AppMode) => void
  scenarios: Scenario[]
  activeScenarioId: number | null
  onScenarioChange: (value: number) => void
  darkMode: boolean
  onToggleTheme: () => void
}

const dashboardSections = [
  { title: "Overview", href: "#overview", icon: ActivityIcon },
  { title: "Schedule load", href: "#schedule", icon: CalendarClockIcon },
  { title: "Summary detail", href: "#summary-detail", icon: BarChart3Icon },
  { title: "People time", href: "#people", icon: UsersIcon },
  { title: "Portfolio mix", href: "#portfolio", icon: Building2Icon },
  { title: "Quality notes", href: "#quality", icon: TriangleAlertIcon },
  { title: "Meeting directory", href: "#directory", icon: FileSpreadsheetIcon },
] as const

function scrollToHash(hash: string) {
  const target = document.getElementById(hash.slice(1))
  if (!target) {
    return
  }

  target.scrollIntoView({ behavior: "smooth", block: "start" })
  window.history.replaceState(null, "", hash)
}

function getScenarioTargetHash(scenario: Scenario) {
  return scenario.kind === "baseline" ? "#app-header" : "#scenario-controls"
}

export function AppSidebar({
  appMode,
  onModeChange,
  scenarios,
  activeScenarioId,
  onScenarioChange,
  darkMode,
  onToggleTheme,
}: AppSidebarProps) {
  const { setOpenMobile } = useSidebar()
  const [activeHash, setActiveHash] = useState("")
  const [dashboardOpen, setDashboardOpen] = useState(appMode === "dashboard")
  const [scenarioOpen, setScenarioOpen] = useState(appMode === "schedule")

  useEffect(() => {
    const syncHash = () => setActiveHash(window.location.hash)

    syncHash()
    window.addEventListener("hashchange", syncHash)
    return () => window.removeEventListener("hashchange", syncHash)
  }, [])

  const navigateToHash = useCallback((hash: string) => {
    setActiveHash(hash)
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        scrollToHash(hash)
      })
    })
  }, [])

  const handleDashboardSectionSelect = useCallback(
    (hash: string) => {
      onModeChange("dashboard")
      setDashboardOpen(true)
      navigateToHash(hash)
      setOpenMobile(false)
    },
    [navigateToHash, onModeChange, setOpenMobile]
  )

  const handleScenarioSelect = useCallback(
    (scenario: Scenario) => {
      onModeChange("schedule")
      onScenarioChange(scenario.id)
      setScenarioOpen(true)
      navigateToHash(getScenarioTargetHash(scenario))
      setOpenMobile(false)
    },
    [navigateToHash, onModeChange, onScenarioChange, setOpenMobile]
  )

  const selectedScenarioId = activeScenarioId ?? scenarios[0]?.id ?? null

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/80">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Meeting builder"
              className="ring-sidebar-ring/50 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground focus-visible:ring-1"
            >
              <div className="border-muted-foreground/25 flex aspect-square size-8 items-center justify-center rounded-lg border bg-transparent">
                <CalendarRangeIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-xs leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold">Meeting builder</span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  Recurring meeting audit
                </span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="lg"
                  tooltip="Dashboard"
                  isActive={appMode === "dashboard"}
                  onClick={() => {
                    onModeChange("dashboard")
                    setDashboardOpen((open) => (appMode === "dashboard" ? !open : true))
                  }}
                >
                  <LayoutDashboardIcon />
                  <span className="group-data-[collapsible=icon]:hidden">Dashboard</span>
                  <ChevronRightIcon
                    className={`ml-auto size-4 transition-transform group-data-[collapsible=icon]:hidden ${dashboardOpen ? "rotate-90" : ""}`}
                  />
                </SidebarMenuButton>
                {dashboardOpen ? (
                  <SidebarMenuSub>
                    {dashboardSections.map((section, index) => (
                      <SidebarMenuSubItem key={section.href}>
                        <SidebarMenuSubButton
                          href={section.href}
                          isActive={
                            appMode === "dashboard" &&
                            (activeHash ? activeHash === section.href : index === 0)
                          }
                          onClick={(event) => {
                            event.preventDefault()
                            handleDashboardSectionSelect(section.href)
                          }}
                        >
                          <section.icon />
                          <span>{section.title}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  size="lg"
                  tooltip="Scenario editor"
                  isActive={appMode === "schedule"}
                  onClick={() => {
                    onModeChange("schedule")
                    setScenarioOpen((open) => (appMode === "schedule" ? !open : true))
                  }}
                >
                  <CalendarRangeIcon />
                  <span className="group-data-[collapsible=icon]:hidden">Scenario editor</span>
                  <ChevronRightIcon
                    className={`ml-auto size-4 transition-transform group-data-[collapsible=icon]:hidden ${scenarioOpen ? "rotate-90" : ""}`}
                  />
                </SidebarMenuButton>
                {scenarioOpen ? (
                  <SidebarMenuSub>
                    {scenarios.map((scenario) => (
                      <SidebarMenuSubItem key={scenario.id}>
                        <SidebarMenuSubButton
                          href={getScenarioTargetHash(scenario)}
                          isActive={appMode === "schedule" && selectedScenarioId === scenario.id}
                          onClick={(event) => {
                            event.preventDefault()
                            handleScenarioSelect(scenario)
                          }}
                        >
                          <span>{scenario.name}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={darkMode ? "Light canvas" : "Dark canvas"}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              onClick={onToggleTheme}
            >
              {darkMode ? <SunMediumIcon /> : <MoonStarIcon />}
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold">
                  {darkMode ? "Light canvas" : "Dark canvas"}
                </span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  Toggle workspace theme
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
