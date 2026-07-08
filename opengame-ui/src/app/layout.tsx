import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "OpenGame Studio",
  description: "AI-powered game creation studio — build web games from text prompts",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full">
        <TooltipProvider>
          <div className="flex h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto pl-64">
              <div className="mx-auto max-w-6xl p-6">
                {children}
              </div>
            </main>
          </div>
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  )
}
