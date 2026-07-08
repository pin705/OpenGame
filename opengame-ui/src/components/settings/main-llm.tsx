"use client"

import { MainLLMConfig } from "@/lib/settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"

interface Props {
  config: MainLLMConfig
  onChange: (partial: Partial<MainLLMConfig>) => void
}

const AUTH_TYPES = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "qwen-oauth", label: "Qwen OAuth" },
  { value: "gemini", label: "Google Gemini" },
  { value: "vertex-ai", label: "Vertex AI" },
] as const

export function MainLLMSettings({ config, onChange }: Props) {
  const [showKey, setShowKey] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Main Agent LLM</CardTitle>
        <CardDescription>
          Configure the model that drives the agent loop. Supports OpenAI, Anthropic, Gemini, and Qwen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Auth Type</Label>
          <Select
            value={config.authType}
            onValueChange={(v) => { if (v) onChange({ authType: v as MainLLMConfig["authType"] }) }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AUTH_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>API Key</Label>
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              value={config.apiKey}
              onChange={(e) => onChange({ apiKey: e.target.value })}
              placeholder="sk-..."
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Base URL</Label>
          <Input
            value={config.baseUrl}
            onChange={(e) => onChange({ baseUrl: e.target.value })}
            placeholder="https://api.openai.com/v1"
          />
        </div>

        <div className="space-y-2">
          <Label>Model</Label>
          <Input
            value={config.model}
            onChange={(e) => onChange({ model: e.target.value })}
            placeholder="gpt-4o"
          />
        </div>
      </CardContent>
    </Card>
  )
}
