"use client"

import { ProviderConfig } from "@/lib/settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"

interface Props {
  title: string
  description: string
  config: ProviderConfig
  onChange: (partial: Partial<ProviderConfig>) => void
  supportedProviders?: string[]
}

const PROVIDERS = [
  { value: "tongyi", label: "Tongyi (DashScope)" },
  { value: "doubao", label: "Doubao (Volcengine)" },
  { value: "openai-compat", label: "OpenAI Compatible" },
] as const

const PROVIDER_HINTS: Record<string, { baseUrl: string; model: string }> = {
  tongyi: {
    baseUrl: "https://dashscope.aliyuncs.com",
    model: "",
  },
  doubao: {
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    model: "",
  },
  "openai-compat": {
    baseUrl: "",
    model: "",
  },
}

export function ProviderConfigCard({
  title,
  description,
  config,
  onChange,
  supportedProviders = ["tongyi", "doubao", "openai-compat"],
}: Props) {
  const [showKey, setShowKey] = useState(false)
  const filteredProviders = PROVIDERS.filter((p) =>
    supportedProviders.includes(p.value)
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Provider</Label>
          <Select
            value={config.provider}
            onValueChange={(v) => {
              if (!v) return
              const hints = PROVIDER_HINTS[v] || {}
              onChange({
                provider: v as ProviderConfig["provider"],
                // Pre-fill baseUrl hint if empty
                ...(!config.baseUrl && hints.baseUrl
                  ? { baseUrl: hints.baseUrl }
                  : {}),
              })
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select provider..." />
            </SelectTrigger>
            <SelectContent>
              {filteredProviders.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
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
            placeholder="https://api.example.com/v1"
          />
        </div>

        <div className="space-y-2">
          <Label>Model</Label>
          <Input
            value={config.model}
            onChange={(e) => onChange({ model: e.target.value })}
            placeholder="model-name"
          />
        </div>
      </CardContent>
    </Card>
  )
}
