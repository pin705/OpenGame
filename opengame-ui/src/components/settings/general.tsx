"use client"

import { GeneralConfig } from "@/lib/settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Props {
  config: GeneralConfig
  onChange: (partial: Partial<GeneralConfig>) => void
}

const APPROVAL_MODES = [
  { value: "plan", label: "Plan", description: "Analyze only, no modifications" },
  { value: "default", label: "Default", description: "Prompt for approval on edits/shell" },
  { value: "auto-edit", label: "Auto Edit", description: "Auto-approve file edits, shell still gated" },
  { value: "yolo", label: "YOLO", description: "Auto-approve everything" },
] as const

export function GeneralSettings({ config, onChange }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>General</CardTitle>
        <CardDescription>General agent behavior and proxy settings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Approval Mode</Label>
          <Select
            value={config.approvalMode}
            onValueChange={(v) => { if (v) onChange({ approvalMode: v as GeneralConfig["approvalMode"] }) }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {APPROVAL_MODES.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  <div>
                    <span className="font-medium">{m.label}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{m.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Max Session Turns</Label>
          <Input
            type="number"
            value={config.maxSessionTurns}
            onChange={(e) => onChange({ maxSessionTurns: parseInt(e.target.value) || 100 })}
            min={1}
            max={9999}
          />
        </div>

        <div className="space-y-2">
          <Label>HTTP Proxy</Label>
          <Input
            value={config.proxy}
            onChange={(e) => onChange({ proxy: e.target.value })}
            placeholder="http://127.0.0.1:7890"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Debug Mode</Label>
            <p className="text-xs text-muted-foreground">Enable verbose logging</p>
          </div>
          <Switch
            checked={config.debug}
            onCheckedChange={(v) => onChange({ debug: v })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Chat Recording</Label>
            <p className="text-xs text-muted-foreground">Save session history</p>
          </div>
          <Switch
            checked={config.chatRecording}
            onCheckedChange={(v) => onChange({ chatRecording: v })}
          />
        </div>
      </CardContent>
    </Card>
  )
}
