"use client"

import { ExtensionsConfig } from "@/lib/settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Puzzle, X, Plus } from "lucide-react"
import { useState } from "react"

interface Props {
  config: ExtensionsConfig
  onChange: (partial: Partial<ExtensionsConfig>) => void
}

export function ExtensionsSettings({ config, onChange }: Props) {
  const [input, setInput] = useState("")

  const addDisabled = () => {
    const trimmed = input.trim()
    if (trimmed && !config.disabled.includes(trimmed)) {
      onChange({ disabled: [...config.disabled, trimmed] })
    }
    setInput("")
  }

  const removeDisabled = (name: string) => {
    onChange({ disabled: config.disabled.filter((n) => n !== name) })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Extensions</CardTitle>
        <CardDescription>
          Manage extensions. Disabled extensions will not be loaded by the CLI.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Disabled Extensions</Label>
          <p className="text-xs text-muted-foreground">
            Extension names listed here will be skipped during loading.
          </p>
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Extension name to disable"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDisabled() } }}
            />
            <Button variant="outline" size="icon" onClick={addDisabled}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {config.disabled.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {config.disabled.map((name) => (
                <Badge key={name} variant="destructive" className="gap-1">
                  <Puzzle className="h-3 w-3" />
                  {name}
                  <button onClick={() => removeDisabled(name)} className="ml-0.5 hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No extensions disabled.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
