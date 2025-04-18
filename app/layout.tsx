import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { RepositoryProvider } from "@/lib/github/context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "RepoInsight - AI-Powered Repository Analysis",
  description: "Analyze GitHub repositories and plan features with AI assistance",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <RepositoryProvider>
            {children}
            <Toaster />
          </RepositoryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
