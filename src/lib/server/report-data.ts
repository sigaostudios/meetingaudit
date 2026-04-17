import { readFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import path from "node:path"
import { cache } from "react"

import type { DashboardContent } from "@/types/dashboard"

type ReportData = {
  seedCsv: string
  seedChecksum: string
  dashboardContent: DashboardContent
}

function getSeedDataPath(filename: string) {
  return path.join(process.cwd(), "public", "data", filename)
}

export const loadReportData = cache(async (): Promise<ReportData> => {
  const [csvText, dashboardContentText] = await Promise.all([
    readFile(getSeedDataPath("meeting-audit.csv"), "utf8"),
    readFile(getSeedDataPath("dashboard-content.json"), "utf8"),
  ])

  return {
    seedCsv: csvText,
    seedChecksum: createHash("sha256").update(csvText).digest("hex"),
    dashboardContent: JSON.parse(dashboardContentText) as DashboardContent,
  }
})
