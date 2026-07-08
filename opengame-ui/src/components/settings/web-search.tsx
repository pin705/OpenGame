"use client"

import { WebSearchConfig } from "@/lib/settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Plus, X } from "lucide-react"
import { useState } from "react"

interface Props {
  config: WebSearchConfig
  onChange: (partial: Partial<WebSearchConfig>) => void
}

const PROVIDER_TYPES = [
  { value: "dashscope", label: "DashScope (Tongyi)" },
  { value: "tavily", label: "Tavily" },
  { value: "google", label: "Google Custom Search" },
] as const

export function WebSearchSettings({ config, onChange }: Props) {
  const [showKeys, setShowKeys] = useState<Record<number, boolean>>({})

  const addProvider = () => {
    onChange({
      provider: [...config.provider, { type: "tavily", apiKey: "" }],
    })
  }

  const removeProvider = (index: number) => {
    onChange({
      provider: config.provider.filter((_, i) => i !== index),
    })
  }

  const updateProvider = (index: number, field: string, value: string) => {
    const updated = config.provider.map((p, i) =>
      i === index ? { ...p, [field]: value } : p
    )
    onChange({ provider: updated })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Web Search</CardTitle>
        <CardDescription>
          Configure web search providers for the agent to search the internet during game generation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Default Provider</Label>
          <Select value={config.default} onValueChange={(v) => { if (v) onChange({ default: v }) }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROVIDER_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Configured Providers</Label>
            <Button variant="outline" size="sm" onClick={addProvider}>
              <Plus className="mr-1 h-3 w-3" />
              Add Provider
            </Button>
          </div>

          {config.provider.length === 0 ? (
            <p className="text-sm text-muted-foreground">No providers configured. Click "Add Provider" to add one.</p>
          ) : (
            config.provider.map((p, i) => (
              <div key={i} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{p.type}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => removeProvider(i)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                <Select value={p.type} onValueChange={(v) => { if (v) updateProvider(i, "type", v) }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDER_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative">
                  <Input
                    type={showKeys[i] ? "text" : "password"}
                    value={p.apiKey || ""}
                    onChange={(e) => updateProvider(i, "apiKey", e.target.value)}
                    placeholder="API Key"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeys((s) => ({ ...s, [i]: !s[i] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showKeys[i] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {p.type === "google" && (
                  <Input
                    value={p.searchEngineId || ""}
                    onChange={(e) => updateProvider(i, "searchEngineId", e.target.value)}
                    placeholder="Search Engine ID"
                  />
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
