import type { DashboardContent } from "@/types/dashboard"
import { resolveAssetPath } from "@/lib/paths"

export async function loadDashboardContent(path = resolveAssetPath("data/dashboard-content.json")) {
  const response = await fetch(path)

  if (!response.ok) {
    throw new Error(`Failed to load dashboard content: ${response.status}`)
  }

  return (await response.json()) as DashboardContent
}
