"use client"

import { useState } from "react"
import { useSettings } from "@/hooks/use-settings"
import { useStream } from "@/hooks/use-stream"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Sparkles, Square, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { StreamMessage } from "@/hooks/use-stream"

const GAME_TYPES = [
  { value: "auto", label: "Auto Classify", description: "Let AI determine the best archetype" },
  { value: "platformer", label: "Platformer", description: "Side-scrolling, gravity-based" },
  { value: "top_down", label: "Top Down", description: "8-way movement, no gravity" },
  { value: "grid_logic", label: "Grid Logic", description: "Discrete grid-based gameplay" },
  { value: "tower_defense", label: "Tower Defense", description: "Path-following enemies" },
  { value: "ui_heavy", label: "UI Heavy", description: "Cards, dialogues, menus" },
] as const

const APPROVAL_MODES = [
  { value: "default", label: "Default" },
  { value: "auto-edit", label: "Auto Edit" },
  { value: "yolo", label: "YOLO" },
  { value: "plan", label: "Plan Only" },
] as const

function MessageBubble({ msg }: { msg: StreamMessage }) {
  const colorMap: Record<string, string> = {
    info: "border-l-blue-500 bg-blue-500/5",
    tool: "border-l-amber-500 bg-amber-500/5",
    output: "border-l-green-500 bg-green-500/5",
    error: "border-l-red-500 bg-red-500/5",
    done: "border-l-emerald-500 bg-emerald-500/5",
  }

  return (
    <div
      className={`border-l-2 ${colorMap[msg.type] || "border-l-gray-500"} rounded-r-md px-3 py-2`}
    >
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[10px]">
          {msg.type.toUpperCase()}
        </Badge>
        <span className="text-[10px] text-muted-foreground">
          {new Date(msg.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <pre className="mt-1 whitespace-pre-wrap text-sm font-mono">{msg.content}</pre>
    </div>
  )
}

export default function CreateGamePage() {
  const { settings } = useSettings()
  const { messages, isStreaming, startStream, stopStream, clearMessages } = useStream()

  const [prompt, setPrompt] = useState("")
  const [gameType, setGameType] = useState("auto")
  const [approvalMode, setApprovalMode] = useState("default")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [sandbox, setSandbox] = useState(false)
  const [maxTurns, setMaxTurns] = useState("100")
  const [model, setModel] = useState("")

  const handleGenerate = () => {
    if (!prompt.trim()) return

    const options: Record<string, string> = {
      "approval-mode": approvalMode,
    }

    if (gameType !== "auto") {
      options["game-type"] = gameType
    }
    if (sandbox) options["sandbox"] = "true"
    if (maxTurns) options["max-session-turns"] = maxTurns
    if (model) options["model"] = model

    startStream(prompt, options)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Game</h1>
        <p className="text-muted-foreground">
          Describe your game and let AI build it for you.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Input form */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Game Description</CardTitle>
              <CardDescription>
                Describe the game you want to create. Be as specific as you like.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. A retro pixel-art platformer where a ninja cat fights through 5 levels of robot enemies, collecting sushi power-ups..."
                rows={6}
                className="resize-none"
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Game Type</Label>
                  <Select value={gameType} onValueChange={(v) => setGameType(v ?? "auto")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GAME_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          <div>
                            <span className="font-medium">{t.label}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {t.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Approval Mode</Label>
                  <Select value={approvalMode} onValueChange={(v) => setApprovalMode(v ?? "default")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {APPROVAL_MODES.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Advanced options toggle */}
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                Advanced Options
              </button>

              {showAdvanced && (
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="space-y-2">
                    <Label>Model Override</Label>
                    <Input
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="Leave empty to use default"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Max Session Turns</Label>
                    <Input
                      type="number"
                      value={maxTurns}
                      onChange={(e) => setMaxTurns(e.target.value)}
                      min={1}
                      max={9999}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Sandbox Mode</Label>
                      <p className="text-xs text-muted-foreground">Run in Docker/Podman</p>
                    </div>
                    <Switch checked={sandbox} onCheckedChange={setSandbox} />
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                {isStreaming ? (
                  <Button variant="destructive" onClick={stopStream} className="flex-1">
                    <Square className="mr-2 h-4 w-4" />
                    Stop
                  </Button>
                ) : (
                  <Button
                    onClick={handleGenerate}
                    disabled={!prompt.trim()}
                    className="flex-1"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Game
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={clearMessages}
                  disabled={isStreaming}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Streaming output */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Agent Output</CardTitle>
                <CardDescription>Real-time generation progress</CardDescription>
              </div>
              {isStreaming && (
                <Badge className="animate-pulse bg-blue-600">Streaming...</Badge>
              )}
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[500px] p-4">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <p>Output will appear here when you generate a game...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} msg={msg} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
