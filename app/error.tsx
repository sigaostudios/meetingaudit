"use client"

import { useEffect } from "react"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Error({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-20">
      <Card className="report-card w-full rounded-[1.1rem] border border-destructive/30">
        <CardHeader>
          <CardTitle>Unable to load the report data</CardTitle>
          <CardDescription>{error.message || "Unknown load failure"}</CardDescription>
        </CardHeader>
      </Card>
    </main>
  )
}
