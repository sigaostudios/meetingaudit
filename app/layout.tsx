import type { Metadata } from "next"

import "./globals.css"

export const metadata: Metadata = {
  title: "Meeting Audit Dashboard",
  description: "Recurring meeting audit dashboard for Vercel-hosted Next.js deployment.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
