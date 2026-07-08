"use client"

import { useEffect, useState } from "react"
import { useSettings } from "@/hooks/use-settings"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles,
  Settings,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  Gamepad2,
  ArrowRight,
} from "lucide-react"

export default function DashboardPage() {
  const { settings, loaded } = useSettings()
  const [recentProjects, setRecentProjects] = useState<string[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem("opengame-recent-projects")
      if (raw) setRecentProjects(JSON.parse(raw))
    } catch {
      // ignore
    }
  }, [])

  const hasMainKey = loaded && !!settings.mainLLM.apiKey
  const hasReasoningKey = loaded && !!settings.providers.reasoning.apiKey
  const hasImageKey = loaded && !!settings.providers.image.apiKey
  const allConfigured = hasMainKey && hasReasoningKey

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">OpenGame Studio</h1>
        <p className="text-muted-foreground">
          AI-powered game creation — build web games from text prompts.
        </p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            {hasMainKey ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-500" />
            )}
            <div>
              <p className="text-sm font-medium">Main LLM</p>
              <p className="text-xs text-muted-foreground">
                {hasMainKey ? "API key configured" : "Not configured"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            {hasReasoningKey ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-500" />
            )}
            <div>
              <p className="text-sm font-medium">Reasoning Provider</p>
              <p className="text-xs text-muted-foreground">
                {hasReasoningKey ? "Configured" : "Not configured"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            {hasImageKey ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-500" />
            )}
            <div>
              <p className="text-sm font-medium">Image Generation</p>
              <p className="text-xs text-muted-foreground">
                {hasImageKey ? "Configured" : "Not configured"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick start */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>Create New Game</CardTitle>
            </div>
            <CardDescription>
              Describe your game idea and let AI build it from scratch.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/create">
              <Button className="w-full" disabled={!allConfigured}>
                {allConfigured ? "Start Creating" : "Configure API Keys First"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            {!allConfigured && (
              <p className="mt-2 text-xs text-amber-500">
                At minimum, configure Main LLM and Reasoning provider in Settings.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>Setup</CardTitle>
            </div>
            <CardDescription>
              Configure your API keys and model preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings">
              <Button variant="outline" className="w-full">
                Open Settings
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent projects */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              <CardTitle>Recent Projects</CardTitle>
            </div>
            <Link href="/projects">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentProjects.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <Gamepad2 className="h-8 w-8" />
              <p>No projects yet. Create your first game!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentProjects.slice(0, 5).map((name) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{name}</span>
                  </div>
                  <Badge variant="outline">Ready</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
