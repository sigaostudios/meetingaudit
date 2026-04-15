import type { ReactNode } from "react"
import {
  ArrowDownIcon,
  Building2Icon,
  Clock3Icon,
  DollarSignIcon,
  DownloadIcon,
  GaugeIcon,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"

import { DashboardWidget, DefinitionTooltip } from "@/components/report/dashboard-widget"
import { MeetingDirectoryDataTable } from "@/components/report/meeting-directory-data-table"
import { ScheduleHeatmap } from "@/components/report/schedule-heatmap"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatHoursFromMinutes, formatMetricMinutes } from "@/lib/reporting"
import type {
  DashboardContent,
  DashboardWidgetDefinition,
  SummaryDrilldownKey,
} from "@/types/dashboard"
import type { MeetingRecord, PersonMetric, ReportSummary } from "@/types/report"

const PURPOSE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "color-mix(in oklch, var(--chart-1) 55%, var(--chart-2) 45%)",
  "color-mix(in oklch, var(--chart-4) 70%, var(--chart-2) 30%)",
]

const DEFAULT_CLIENT_COLORS = [
  "#4f7cff",
  "#e59a3b",
  "#2bb6a3",
  "#c96bdb",
  "#7d8aa3",
  "#e36f5d",
]

const DEFAULT_PERSON_COLORS = [
  "#e36f5d",
  "#d2a02e",
  "#4f7cff",
  "#b76bd6",
  "#3fb69a",
  "#f08c3c",
  "#49bca8",
  "#c9872a",
  "#5bb0ff",
  "#d169c7",
  "#8f9ae6",
]

const CHART_AXIS_TICK = {
  fill: "var(--foreground)",
  fontSize: 12,
  fontWeight: 500,
  opacity: 0.92,
} as const

const clientChartConfig = {
  weeklyAttendeeMinutes: {
    label: "Weighted attendee-minutes",
    color: "var(--color-chart-3)",
  },
}

export type ReportBlockProps = {
  widget: DashboardWidgetDefinition
  data: ReportSummary
  content: DashboardContent
  selectedSummaryDrilldown: SummaryDrilldownKey
  setSelectedSummaryDrilldown: (key: SummaryDrilldownKey) => void
  selectedPersonName: string | null
  setSelectedPersonName: (name: string | null) => void
}

export type BlockRenderer = (props: ReportBlockProps) => ReactNode

type SummaryDrilldownItem = {
  key: SummaryDrilldownKey
  label: string
  value: string
  detail: string
  definition: string
  meetings: MeetingRecord[]
}

export function TopBarBlock({ content }: { content: DashboardContent }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/72">
      <div className="mx-auto flex h-(--header-height) max-w-[1480px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <SidebarTrigger className="-ml-1 rounded-full" />
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {content.topBar.eyebrow}
            </p>
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-sm font-medium text-foreground">
                {content.topBar.title}
              </p>
              <Badge className="hidden rounded-full border-none bg-primary/12 px-3 py-1 text-primary sm:inline-flex">
                {content.topBar.badge}
              </Badge>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          className="rounded-full bg-background/70 backdrop-blur"
          render={<a href="/data/meeting-audit.csv" download />}
        >
          <DownloadIcon />
          <span className="hidden sm:inline">Download normalized CSV</span>
          <span className="sm:hidden">Download CSV</span>
        </Button>
      </div>
    </header>
  )
}

export function HeroBlock({
  data,
  content,
}: {
  data: ReportSummary
  content: DashboardContent
}) {
  const topClient = data.clientMetrics.find((metric) => metric.client !== "Internal")
  const topClientCost = topClient
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format((topClient.weeklyAttendeeMinutes / 60) * 100)
    : null

  return (
    <section className="report-hero">
      <div className="report-card overflow-hidden rounded-[2.25rem] border-none">
        <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] lg:px-10 lg:py-10">
          <div className="grid min-w-0 gap-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              {content.hero.eyebrow}
            </p>

            <div className="grid gap-4">
              <h1 className="max-w-[10ch] text-balance font-heading text-4xl leading-none tracking-[-0.05em] text-foreground sm:text-5xl xl:text-[4.8rem]">
                {content.hero.title}
              </h1>
              <p className="max-w-[64ch] text-sm leading-7 text-muted-foreground sm:text-base">
                {content.hero.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                className="rounded-full px-5"
                render={<a href={content.hero.primaryAction.href} />}
              >
                {content.hero.primaryAction.label}
                <ArrowDownIcon />
              </Button>
              <Button
                variant="outline"
                className="rounded-full bg-background/60"
                render={<a href={content.hero.secondaryAction.href} />}
              >
                {content.hero.secondaryAction.label}
              </Button>
            </div>
          </div>

          <div className="grid min-w-0 gap-4 self-end">
            <div className="grid gap-4 rounded-[1.75rem] border border-border/70 bg-background/65 p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      {content.hero.summaryLabel}
                    </p>
                    <DefinitionTooltip definition={content.hero.summaryTooltip} />
                  </div>
                  <p className="metric-value mt-2 text-5xl text-foreground">
                    {formatHoursFromMinutes(data.totalWeeklyAttendeeMinutes)}
                  </p>
                </div>
                <Tooltip>
                  <TooltipTrigger className="rounded-full border border-border/70 p-2 text-muted-foreground transition-colors hover:text-foreground">
                    <GaugeIcon className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-64 bg-foreground text-background">
                    {content.hero.summaryTooltip}
                  </TooltipContent>
                </Tooltip>
              </div>
              <Separator />
              <div className="grid gap-3 sm:grid-cols-2">
                <HeroChip
                  icon={<Clock3Icon className="size-4" />}
                  label={content.hero.chips.busiestDay.label}
                  value={data.busiestWeekday ?? "Unmapped"}
                  definition={content.hero.chips.busiestDay.tooltip}
                />
                <HeroChip
                  icon={<DollarSignIcon className="size-4" />}
                  label={content.hero.chips.weeklyCost.label}
                  value={data.weeklyMeetingCostLabel}
                  definition={content.hero.chips.weeklyCost.tooltip}
                />
                <HeroChip
                  icon={<Building2Icon className="size-4" />}
                  label={content.hero.chips.mostExpensiveClient.label}
                  value={topClient?.client ?? "Internal"}
                  detail={topClientCost ? `${topClientCost} / week` : "No client-tagged meetings"}
                  definition={content.hero.chips.mostExpensiveClient.tooltip}
                  className="sm:col-span-2"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function OverviewBlock({ widget, data, content }: ReportBlockProps) {
  return (
    <DashboardWidget
      id={widget.anchorId}
      colSpan={widget.colSpan}
      title={widget.title}
      description={widget.description}
      tooltip={widget.tooltip}
      data={data}
      content={
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {data.kpis.map((metric) => (
            <MetricTile
              key={metric.label}
              label={metric.label}
              value={metric.value}
              detail={metric.detail}
              definition={content.kpiDefinitions[metric.label] ?? "Definition not provided."}
            />
          ))}
        </div>
      }
    />
  )
}

function ScheduleBlock({ widget, data }: ReportBlockProps) {
  return (
    <DashboardWidget
      id={widget.anchorId}
      colSpan={widget.colSpan}
      title={widget.title}
      description={widget.description}
      tooltip={widget.tooltip}
      data={data}
      content={<ScheduleHeatmap cells={data.heatCells} />}
    />
  )
}

function OwnerLoadBlock({
  widget,
  data,
  content,
  selectedSummaryDrilldown,
  setSelectedSummaryDrilldown,
}: ReportBlockProps) {
  const drilldownItems = getSummaryDrilldownItems(data, content)
  const selectedItem =
    drilldownItems.find((item) => item.key === selectedSummaryDrilldown) ?? drilldownItems[0]
  const selectedMeetings = [...selectedItem.meetings].sort(
    (left, right) => right.weeklyWeightedAttendeeMinutes - left.weeklyWeightedAttendeeMinutes
  )

  return (
    <DashboardWidget
      id={widget.anchorId}
      colSpan={widget.colSpan}
      title={widget.title}
      description={widget.description}
      tooltip={widget.tooltip}
      data={data}
      content={
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.8fr)] lg:items-stretch">
          <div className="rounded-[1.5rem] border border-border/70 bg-background/45">
            <Table className="[&_td]:align-top">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Meeting</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Weekly load</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedMeetings.map((meeting) => (
                  <TableRow key={`${meeting.owner_name}-${meeting.meeting_name}-${meeting.time}`}>
                    <TableCell className="py-3">
                      <div className="grid gap-0.5 whitespace-normal">
                        <p className="font-medium text-foreground">{meeting.meeting_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {meeting.dataNotes.length > 0
                            ? meeting.dataNotes.join(" | ")
                            : meeting.primary_purpose}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 whitespace-normal">{meeting.owner_name}</TableCell>
                    <TableCell className="py-3">
                      <div className="grid gap-0.5 whitespace-normal">
                        <p className="text-foreground">{meeting.time}</p>
                        <p className="text-xs text-muted-foreground">
                          {meeting.weekdays.length > 0
                            ? `${meeting.weekdays.join(", ")} | ${meeting.cadence}`
                            : meeting.cadence}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 whitespace-normal">{meeting.clientLabel}</TableCell>
                    <TableCell className="py-3 text-right">
                      <div className="grid gap-0.5">
                        <p className="font-mono text-sm font-medium tabular-nums text-foreground">
                          {formatMetricMinutes(meeting.weeklyWeightedAttendeeMinutes)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {meeting.attendeeCount} attendees
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid content-start gap-4 rounded-[1.5rem] border border-border/70 bg-background/45 p-4">
            {drilldownItems.map((item) => (
              <MetricTile
                key={item.key}
                label={item.label}
                value={item.value}
                detail={item.detail}
                definition={item.definition}
                interactive
                selected={selectedSummaryDrilldown === item.key}
                onSelect={() => setSelectedSummaryDrilldown(item.key)}
              />
            ))}
          </div>
        </div>
      }
    />
  )
}
function WorkloadSummaryBlock({
  widget,
  data,
  content,
  selectedSummaryDrilldown,
  setSelectedSummaryDrilldown,
}: ReportBlockProps) {
  const drilldownItems = getSummaryDrilldownItems(data, content)
  return (
    <DashboardWidget
      id={widget.anchorId}
      colSpan={widget.colSpan}
      title={widget.title}
      description={widget.description}
      tooltip={widget.tooltip}
      data={data}
      content={
        <div className="grid gap-4">
          {drilldownItems.map((item) => (
            <MetricTile
              key={item.key}
              label={item.label}
              value={item.value}
              detail={item.detail}
              definition={item.definition}
              interactive
              selected={selectedSummaryDrilldown === item.key}
              onSelect={() => setSelectedSummaryDrilldown(item.key)}
            />
          ))}
        </div>
      }
    />
  )
}

function PersonLoadBlock({
  widget,
  data,
  content,
  selectedPersonName,
  setSelectedPersonName,
}: ReportBlockProps) {
  const selectedPerson =
    data.personMetrics.find((person) => person.name === selectedPersonName) ?? null
  const clientKeys = getPersonClientKeys(data.personMetrics)
  const clientSeries = clientKeys.map((label, index) => ({
    label,
    key: toChartKey(label, index),
    color: getClientColor(content, label, index),
  }))
  const personChartConfig = buildPersonChartConfig(clientSeries)
  const chartData = data.personMetrics.map((person) => {
    const row = {
      name: person.name,
      weeklyMinutes: person.weeklyMinutes,
      totalLabel: formatHoursFromMinutes(person.weeklyMinutes),
    } as Record<string, string | number>

    for (const series of clientSeries) {
      row[series.key] =
        person.clientBreakdown.find((item) => item.label === series.label)?.weeklyMinutes ?? 0
    }

    return row
  })

  return (
    <DashboardWidget
      id={widget.anchorId}
      colSpan={widget.colSpan}
      title={widget.title}
      description={
        selectedPerson
          ? `${selectedPerson.name} · ${formatHoursFromMinutes(selectedPerson.weeklyMinutes)} in meetings · ${formatWeeklyCost(selectedPerson.weeklyMinutes)} estimated weekly cost`
          : widget.description
      }
      tooltip={widget.tooltip}
      data={data}
      headerAction={
        selectedPerson ? (
          <Button variant="outline" size="sm" onClick={() => setSelectedPersonName(null)}>
            Show all people
          </Button>
        ) : null
      }
      content={
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.85fr)] lg:items-stretch">
          <div className="min-w-0 lg:min-h-[440px]">
            {selectedPerson ? (
              <Tabs defaultValue="client" key={selectedPerson.name} className="gap-6">
                <TabsList variant="line" className="border-b bg-transparent p-0">
                  <TabsTrigger value="client">Time by client</TabsTrigger>
                  <TabsTrigger value="day">Time by day</TabsTrigger>
                  <TabsTrigger value="type">Time by type</TabsTrigger>
                </TabsList>

                <TabsContent value="client">
                  <MetricBreakdownChart
                    data={selectedPerson.clientBreakdown}
                    labelKey="label"
                    valueKey="weeklyMinutes"
                    colorByLabel={content.entityColors.clients}
                  />
                </TabsContent>

                <TabsContent value="day">
                  <MetricBreakdownChart
                    data={selectedPerson.weekdayBreakdown}
                    labelKey="weekday"
                    valueKey="weeklyMinutes"
                  />
                </TabsContent>

                <TabsContent value="type">
                  <MetricBreakdownChart
                    data={selectedPerson.purposeBreakdown}
                    labelKey="label"
                    valueKey="weeklyMinutes"
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <ChartContainer
                config={personChartConfig}
                className="h-[440px] min-h-[440px] w-full"
              >
                <BarChart
                  accessibilityLayer
                  data={chartData}
                  layout="vertical"
                  margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                  barCategoryGap={10}
                >
                  <CartesianGrid horizontal={false} />
                  <ChartLegend
                    verticalAlign="top"
                    content={
                      <ChartLegendContent className="flex-wrap justify-start gap-x-4 gap-y-2 pb-5 pt-0" />
                    }
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    width={124}
                    tick={CHART_AXIS_TICK}
                  />
                  <XAxis type="number" hide />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        indicator="line"
                        formatter={(value, name, item) => {
                          const person = item.payload as Record<string, number | string>

                          return (
                            <div className="grid min-w-52 gap-1">
                              <div className="flex items-center justify-between gap-6">
                                <span className="text-muted-foreground">
                                  {personChartConfig[String(name)]?.label ?? String(name)}
                                </span>
                                <span className="font-mono tabular-nums text-foreground">
                                  {formatMetricMinutes(Number(value))}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-6">
                                <span className="text-muted-foreground">Total</span>
                                <span className="font-mono tabular-nums text-foreground">
                                  {formatMetricMinutes(Number(person.weeklyMinutes))}
                                </span>
                              </div>
                            </div>
                          )
                        }}
                      />
                    }
                  />
                  {clientSeries.map((series) => (
                    <Bar
                      key={series.key}
                      dataKey={series.key}
                      stackId="personClient"
                      fill={`var(--color-${series.key})`}
                      radius={0}
                      maxBarSize={28}
                    />
                  ))}
                </BarChart>
              </ChartContainer>
            )}
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-background/45 lg:h-[440px]">
            <Table className="[&_td]:align-top">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Person</TableHead>
                  <TableHead className="text-right">Weekly time</TableHead>
                </TableRow>
              </TableHeader>
            </Table>
            <div className="max-h-[380px] overflow-y-auto lg:max-h-[380px]">
              <Table className="[&_td]:align-top">
                <TableBody>
                  {data.personMetrics.map((person) => (
                    <TableRow
                      key={person.name}
                      className={`cursor-pointer border-border/60 ${
                        selectedPersonName === person.name ? "bg-primary/8" : ""
                      }`}
                      onClick={() => setSelectedPersonName(person.name)}
                    >
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3 whitespace-normal">
                          <Avatar
                            className="size-9 rounded-xl border bg-muted/40"
                            style={{ borderColor: getPersonColor(content, person.name) }}
                          >
                            <AvatarImage src={getPersonAvatarUrl(person.name)} alt={person.name} />
                            <AvatarFallback
                              className="rounded-xl text-background"
                              style={{ backgroundColor: getPersonColor(content, person.name) }}
                            >
                              {getInitials(person.name)}
                            </AvatarFallback>
                          </Avatar>
                          <p className="font-medium text-foreground">{person.name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <p className="font-medium tabular-nums text-foreground">
                          {formatHoursFromMinutes(person.weeklyMinutes)}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      }
    />
  )
}
function PersonBreakdownBlock({
  widget,
  data,
  content,
  setSelectedPersonName,
  selectedPersonName,
}: ReportBlockProps) {
  return (
    <DashboardWidget
      id={widget.anchorId}
      colSpan={widget.colSpan}
      title={widget.title}
      description={widget.description}
      tooltip={widget.tooltip}
      data={data}
      content={
        <div className="rounded-[1.5rem] border border-border/70 bg-background/45">
          <Table className="[&_td]:align-top">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Person</TableHead>
                <TableHead className="text-right">Weekly time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.personMetrics.map((person) => (
                <TableRow
                  key={person.name}
                  className={`cursor-pointer border-border/60 ${
                    selectedPersonName === person.name ? "bg-primary/8" : ""
                  }`}
                  onClick={() => setSelectedPersonName(person.name)}
                >
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3 whitespace-normal">
                      <Avatar
                        className="size-9 rounded-xl border bg-muted/40"
                        style={{ borderColor: getPersonColor(content, person.name) }}
                      >
                        <AvatarImage src={getPersonAvatarUrl(person.name)} alt={person.name} />
                        <AvatarFallback
                          className="rounded-xl text-background"
                          style={{ backgroundColor: getPersonColor(content, person.name) }}
                        >
                          {getInitials(person.name)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-medium text-foreground">{person.name}</p>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <p className="font-medium tabular-nums text-foreground">
                      {formatHoursFromMinutes(person.weeklyMinutes)}
                    </p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      }
    />
  )
}

function PortfolioBlock({ widget, data, content }: ReportBlockProps) {
  const clientLeaders = data.clientMetrics
    .filter((metric) => metric.client !== "Internal")
    .slice(0, 5)
  const purposeTotal = data.purposeMetrics.reduce(
    (sum, item) => sum + item.weeklyAttendeeMinutes,
    0
  )

  return (
    <DashboardWidget
      id={widget.anchorId}
      colSpan={widget.colSpan}
      title={widget.title}
      description={widget.description}
      tooltip={widget.tooltip}
      data={data}
      content={
        <Tabs defaultValue="purpose" className="gap-6">
          <TabsList variant="line" className="border-b bg-transparent p-0">
            <TabsTrigger value="purpose">Meeting purpose</TabsTrigger>
            <TabsTrigger value="mix">Client split</TabsTrigger>
            <TabsTrigger value="leaders">Top clients</TabsTrigger>
          </TabsList>

          <TabsContent value="purpose">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,2.4fr)_12rem] lg:items-center">
              <ChartContainer config={{}} className="h-[560px] min-h-[560px] w-full">
                <PieChart>
                  <Pie
                    data={data.purposeMetrics}
                    dataKey="weeklyAttendeeMinutes"
                    nameKey="purpose"
                    innerRadius={150}
                    outerRadius={236}
                    paddingAngle={2}
                  >
                    {data.purposeMetrics.map((metric, index) => (
                      <Cell
                        key={metric.purpose}
                        fill={PURPOSE_COLORS[index % PURPOSE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value, name) => (
                          <div className="flex min-w-44 items-center justify-between gap-6">
                            <span className="text-muted-foreground">{String(name)}</span>
                            <span className="font-mono tabular-nums text-foreground">
                              {formatMetricMinutes(Number(value))}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                </PieChart>
              </ChartContainer>

              <div className="grid w-full max-w-[12rem] gap-0.5 self-center justify-self-end">
                {data.purposeMetrics.map((metric, index) => (
                  <div
                    key={metric.purpose}
                    className="border-b border-border/45 py-2 last:border-b-0"
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex min-w-0 items-start gap-2">
                        <span
                          className="mt-1 size-1.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              PURPOSE_COLORS[index % PURPOSE_COLORS.length],
                          }}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-medium leading-none">
                            {metric.purpose}
                          </p>
                          <p className="mt-1 text-[9px] leading-none text-muted-foreground">
                            {metric.meetingCount} recurring meetings
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-mono text-[10px] font-medium tabular-nums leading-none">
                          {formatMetricMinutes(metric.weeklyAttendeeMinutes)}
                        </p>
                        <p className="mt-1 text-[9px] leading-none text-muted-foreground">
                          {((metric.weeklyAttendeeMinutes / Math.max(1, purposeTotal)) * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mix">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <ChartContainer
                config={clientChartConfig}
                className="h-[300px] min-h-[300px] w-full"
              >
                <BarChart
                  accessibilityLayer
                  data={data.clientMixMetrics}
                  margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 6" />
                  <XAxis
                    dataKey="client"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis hide />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value) => (
                          <div className="flex min-w-40 items-center justify-between gap-6">
                            <span className="text-muted-foreground">Weighted load</span>
                            <span className="font-mono tabular-nums text-foreground">
                              {formatMetricMinutes(Number(value))}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                    <Bar dataKey="weeklyAttendeeMinutes" radius={14}>
                    {data.clientMixMetrics.map((metric, index) => (
                      <Cell
                        key={metric.client}
                        fill={
                          metric.client === "Internal"
                            ? getClientColor(content, "Internal")
                            : DEFAULT_CLIENT_COLORS[index % DEFAULT_CLIENT_COLORS.length]
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>

              <div className="grid gap-3">
                {data.clientMixMetrics.map((metric, index) => (
                  <div
                    key={metric.client}
                    className="rounded-2xl border border-border/70 bg-background/65 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="size-3 rounded-full"
                        style={{
                          backgroundColor:
                            metric.client === "Internal"
                              ? getClientColor(content, "Internal")
                              : DEFAULT_CLIENT_COLORS[index % DEFAULT_CLIENT_COLORS.length],
                        }}
                      />
                      <div>
                        <p className="font-medium">{metric.client}</p>
                        <p className="text-xs text-muted-foreground">
                          {metric.meetingCount} source meetings
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 font-heading text-3xl tracking-[-0.04em]">
                      {formatHoursFromMinutes(metric.weeklyAttendeeMinutes)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="leaders">
            <div className="grid gap-3">
              {clientLeaders.map((metric, index) => (
                <div
                  key={metric.client}
                  className="grid gap-2 rounded-2xl border border-border/70 bg-background/65 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Rank {index + 1}
                      </p>
                      <p className="mt-1 font-medium">{metric.client}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-medium tabular-nums">
                        {formatMetricMinutes(metric.weeklyAttendeeMinutes)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {metric.meetingCount} recurring meetings
                      </p>
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(metric.weeklyAttendeeMinutes / Math.max(1, clientLeaders[0]?.weeklyAttendeeMinutes ?? 1)) * 100}%`,
                        backgroundColor: getClientColor(content, metric.client, index),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      }
    />
  )
}

function QualityNotesBlock({ widget, data }: ReportBlockProps) {
  const costDriverMeetings = [...data.meetings]
    .sort((left, right) => right.weeklyWeightedAttendeeMinutes - left.weeklyWeightedAttendeeMinutes)
    .slice(0, 6)

  return (
    <DashboardWidget
      id={widget.anchorId}
      colSpan={widget.colSpan}
      title={widget.title}
      description={widget.description}
      tooltip={widget.tooltip}
      data={data}
      content={
        <div className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-background/45">
          <Table className="[&_td]:align-top">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Meeting</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Weekly time</TableHead>
                <TableHead className="text-right">Est. weekly cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costDriverMeetings.map((meeting) => (
                <TableRow key={`${meeting.owner_name}-${meeting.meeting_name}-${meeting.time}`}>
                  <TableCell className="py-3">
                    <div className="grid gap-0.5 whitespace-normal">
                      <p className="font-medium text-foreground">{meeting.meeting_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {meeting.attendeeCount} attendees · {meeting.owner_name}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="grid gap-0.5 whitespace-normal">
                      <p className="text-foreground">{meeting.timeBucketLabel}</p>
                      <p className="text-xs text-muted-foreground">
                        {meeting.weekdays.length > 0
                          ? `${meeting.weekdays.join(", ")} · ${meeting.cadence}`
                          : meeting.cadence}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 whitespace-normal">
                    <Badge
                      variant="secondary"
                      className="rounded-full border border-border/70 bg-background/70"
                    >
                      {meeting.clientLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <p className="font-mono text-sm font-medium tabular-nums text-foreground">
                      {formatHoursFromMinutes(meeting.weeklyWeightedAttendeeMinutes)}
                    </p>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <p className="font-mono text-sm font-medium tabular-nums text-foreground">
                      {formatWeeklyCost(meeting.weeklyWeightedAttendeeMinutes)}
                    </p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      }
    />
  )
}

function ClientLoadBlock({ widget, data, content }: ReportBlockProps) {
  const clientLeaders = data.clientMetrics
    .filter((metric) => metric.client !== "Internal")
    .slice(0, 5)

  return (
    <DashboardWidget
      id={widget.anchorId}
      colSpan={widget.colSpan}
      title={widget.title}
      description={widget.description}
      tooltip={widget.tooltip}
      data={data}
      content={
        <div className="grid gap-3">
          {clientLeaders.map((client, index) => (
            <div
              key={client.client}
              className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-background/65 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: getClientColor(content, client.client, index) }}
                />
                <div>
                  <p className="font-medium">{client.client}</p>
                  <p className="text-xs text-muted-foreground">
                    {client.meetingCount} recurring meetings
                  </p>
                </div>
              </div>
              <p className="font-mono text-sm font-medium tabular-nums">
                {formatMetricMinutes(client.weeklyAttendeeMinutes)}
              </p>
            </div>
          ))}
        </div>
      }
    />
  )
}

function DirectoryBlock({ widget, data }: ReportBlockProps) {
  const directoryMeetings = [...data.meetings].sort(
    (left, right) => right.weeklyWeightedAttendeeMinutes - left.weeklyWeightedAttendeeMinutes
  )

  return (
    <DashboardWidget
      id={widget.anchorId}
      colSpan={widget.colSpan}
      title={widget.title}
      description={widget.description}
      tooltip={widget.tooltip}
      data={data}
      content={<MeetingDirectoryDataTable meetings={directoryMeetings} />}
    />
  )
}

function HeroChip({
  icon,
  label,
  value,
  detail,
  definition,
  className,
}: {
  icon: ReactNode
  label: string
  value: string
  detail?: string
  definition: string
  className?: string
}) {
  return (
    <div className={`rounded-2xl border border-border/70 bg-background/75 px-4 py-3 ${className ?? ""}`}>
      <div className="flex items-center gap-2 text-muted-foreground">{icon}</div>
      <div className="mt-3 flex items-center gap-1.5">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <DefinitionTooltip definition={definition} />
      </div>
      <p className="mt-1 font-medium text-foreground">{value}</p>
      {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
    </div>
  )
}

function MetricTile({
  label,
  value,
  detail,
  definition,
  compact = false,
  interactive = false,
  selected = false,
  onSelect,
}: {
  label: string
  value: string
  detail: string
  definition: string
  compact?: boolean
  interactive?: boolean
  selected?: boolean
  onSelect?: () => void
}) {
  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                onSelect?.()
              }
            }
          : undefined
      }
      className={
        compact
          ? "rounded-2xl border border-border/70 bg-background/75 px-4 py-3"
          : `rounded-2xl border p-4 ${
              selected
                ? "border-primary/70 bg-primary/8 shadow-[0_0_0_1px_color-mix(in_oklch,var(--primary)_35%,transparent)]"
                : "border-border/70 bg-background/65"
            } ${interactive ? "cursor-pointer transition-colors hover:border-primary/45 hover:bg-background/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50" : ""}`
      }
    >
      <div className="flex items-center gap-1.5">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <DefinitionTooltip definition={definition} />
      </div>
      <p className={compact ? "mt-2 font-medium text-foreground" : "metric-value mt-3 text-3xl text-foreground"}>
        {value}
      </p>
      <p className={compact ? "mt-1 text-xs text-muted-foreground" : "mt-2 text-sm text-muted-foreground"}>
        {detail}
      </p>
    </div>
  )
}

function getSummaryDrilldownItems(
  data: ReportSummary,
  content: DashboardContent
): SummaryDrilldownItem[] {
  const topClient = data.clientMetrics.find((metric) => metric.client !== "Internal")

  return [
    {
      key: "highFrequency",
      label: "High-frequency routines",
      value: `${data.meetings.filter((meeting) => meeting.weekdays.length >= 4).length} meetings`,
      detail: "Recurring 4-5 days per week",
      definition: content.workloadSummaryDefinitions["High-frequency routines"],
      meetings: data.meetings.filter((meeting) => meeting.weekdays.length >= 4),
    },
    {
      key: "meetingsWithNotes",
      label: "Meetings with notes",
      value: `${data.meetings.filter((meeting) => meeting.dataNotes.length > 0).length} entries`,
      detail: "Source notes or parsing notes attached to the record",
      definition: content.workloadSummaryDefinitions["Meetings with notes"],
      meetings: data.meetings.filter((meeting) => meeting.dataNotes.length > 0),
    },
    {
      key: "largestClientFootprint",
      label: "Largest client footprint",
      value: topClient?.client ?? "Internal",
      detail: topClient
        ? `${formatMetricMinutes(topClient.weeklyAttendeeMinutes)} per week`
        : "No client-labeled meetings",
      definition: content.workloadSummaryDefinitions["Largest client footprint"],
      meetings: topClient
        ? data.meetings.filter((meeting) => meeting.clientLabel === topClient.client)
        : [],
    },
  ]
}

function MetricBreakdownChart<T extends object>({
  data,
  labelKey,
  valueKey,
  colorByLabel,
}: {
  data: T[]
  labelKey: keyof T
  valueKey: keyof T
  colorByLabel?: Record<string, string>
}) {
  return (
    <ChartContainer config={{}} className="h-[320px] min-h-[320px] w-full">
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{ left: 8, right: 32, top: 8, bottom: 8 }}
        barCategoryGap={10}
      >
        <CartesianGrid horizontal={false} />
        <YAxis
          type="category"
          dataKey={String(labelKey)}
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          width={124}
          tick={CHART_AXIS_TICK}
        />
        <XAxis type="number" hide />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideLabel
              indicator="line"
              formatter={(value, name) => (
                <div className="flex min-w-40 items-center justify-between gap-6">
                  <span className="text-muted-foreground">{String(name)}</span>
                  <span className="font-mono tabular-nums text-foreground">
                    {formatMetricMinutes(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        <Bar dataKey={String(valueKey)} fill="var(--color-chart-2)" radius={0} maxBarSize={28}>
          {colorByLabel
            ? data.map((item, index) => {
                const label = String(item[labelKey] ?? "")

                return (
                  <Cell
                    key={`${label}-${index}`}
                    fill={
                      colorByLabel[label] ??
                      DEFAULT_CLIENT_COLORS[index % DEFAULT_CLIENT_COLORS.length]
                    }
                  />
                )
              })
            : null}
          <LabelList
            dataKey={String(valueKey)}
            position="right"
            offset={8}
            className="fill-foreground"
            fontSize={12}
            formatter={(value) => formatHoursFromMinutes(Number(value))}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

function getPersonClientKeys(people: PersonMetric[]) {
  return [...new Set(people.flatMap((person) => person.clientBreakdown.map((item) => item.label)))]
    .sort((left, right) => {
      if (left === "Internal") return 1
      if (right === "Internal") return -1
      return left.localeCompare(right)
    })
}

function buildPersonChartConfig(
  clientSeries: Array<{ key: string; label: string; color: string }>
): ChartConfig {
  return clientSeries.reduce<ChartConfig>((config, series) => {
    config[series.key] = {
      label: series.label,
      color: series.color,
    }

    return config
  }, {})
}

function toChartKey(value: string, index: number) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  return normalized ? `${normalized}-${index}` : `series-${index}`
}

function getClientColor(content: DashboardContent, client: string, index = 0) {
  return (
    content.entityColors.clients[client] ??
    DEFAULT_CLIENT_COLORS[index % DEFAULT_CLIENT_COLORS.length]
  )
}

function getPersonColor(content: DashboardContent, person: string, index = 0) {
  return (
    content.entityColors.people[person] ??
    DEFAULT_PERSON_COLORS[index % DEFAULT_PERSON_COLORS.length]
  )
}

function formatWeeklyCost(minutes: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format((minutes / 60) * 100)
}

function getPersonAvatarUrl(name: string) {
  return `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(name)}`
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export {
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
}



