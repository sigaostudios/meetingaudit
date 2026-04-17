import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-20">
      <Card className="report-card w-full rounded-[1.1rem]">
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
