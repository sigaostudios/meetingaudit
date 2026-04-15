import type { DashboardContent } from "@/types/dashboard"

export async function loadDashboardContent(path = "/data/dashboard-content.json") {
  const response = await fetch(path)

  if (!response.ok) {
    throw new Error(`Failed to load dashboard content: ${response.status}`)
  }

  return (await response.json()) as DashboardContent
}
