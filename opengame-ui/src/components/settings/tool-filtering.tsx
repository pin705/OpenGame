"use client"

import { ToolFilteringConfig } from "@/lib/settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, Plus } from "lucide-react"
import { useState } from "react"

interface Props {
  config: ToolFilteringConfig
  onChange: (partial: Partial<ToolFilteringConfig>) => void
}

function TagInput({
  label,
  description,
  tags,
  onChange,
  placeholder,
}: {
  label: string
  description: string
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder: string
}) {
  const [input, setInput] = useState("")

  const addTag = () => {
    const trimmed = input.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
    }
    setInput("")
  }

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag))
  }

  return (
    <div className="space-y-2">
      <div>
        <Label>{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag() } }}
        />
        <Button variant="outline" size="icon" onClick={addTag}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button onClick={() => removeTag(tag)} className="ml-0.5 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

export function ToolFilteringSettings({ config, onChange }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tool Filtering</CardTitle>
        <CardDescription>
          Control which tools the agent can use. Allowed tools bypass confirmation; excluded tools are completely disabled.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <TagInput
          label="Allowed Tools"
          description="Tool names that bypass the confirmation dialog."
          tags={config.allowed}
          onChange={(allowed) => onChange({ allowed })}
          placeholder="e.g. read_file, grep_search"
        />

        <TagInput
          label="Excluded Tools"
          description="Tool names to completely exclude from discovery."
          tags={config.exclude}
          onChange={(exclude) => onChange({ exclude })}
          placeholder="e.g. run_shell_command"
        />
      </CardContent>
    </Card>
  )
}
