import App from "@/App"
import { loadReportData } from "@/lib/server/report-data"

export default async function Page() {
  const { seedCsv, seedChecksum, dashboardContent } = await loadReportData()

  return (
    <App
      seedCsv={seedCsv}
      seedChecksum={seedChecksum}
      dashboardContent={dashboardContent}
    />
  )
}
