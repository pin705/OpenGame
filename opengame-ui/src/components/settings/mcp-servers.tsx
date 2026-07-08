"use client"

import { MCPServerConfig } from "@/lib/settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Plus, X, Server } from "lucide-react"
import { useState } from "react"

interface Props {
  servers: Record<string, MCPServerConfig>
  onChange: (name: string, config: MCPServerConfig | null) => void
}

export function MCPServersSettings({ servers, onChange }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState("")
  const [newCommand, setNewCommand] = useState("")
  const [newArgs, setNewArgs] = useState("")

  const addServer = () => {
    if (!newName.trim() || !newCommand.trim()) return
    onChange(newName.trim(), {
      command: newCommand.trim(),
      args: newArgs.trim() ? newArgs.trim().split(/\s+/) : [],
    })
    setNewName("")
    setNewCommand("")
    setNewArgs("")
    setShowAdd(false)
  }

  const serverEntries = Object.entries(servers)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>MCP Servers</CardTitle>
            <CardDescription>
              Configure Model Context Protocol servers for extended tool capabilities.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="mr-1 h-3 w-3" />
            Add Server
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAdd && (
          <div className="space-y-3 rounded-lg border p-4">
            <div className="space-y-2">
              <Label>Server Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. filesystem, github"
              />
            </div>
            <div className="space-y-2">
              <Label>Command</Label>
              <Input
                value={newCommand}
                onChange={(e) => setNewCommand(e.target.value)}
                placeholder="e.g. npx, node, /usr/bin/mcp-server"
              />
            </div>
            <div className="space-y-2">
              <Label>Arguments (space-separated)</Label>
              <Input
                value={newArgs}
                onChange={(e) => setNewArgs(e.target.value)}
                placeholder="e.g. -y @modelcontextprotocol/server-filesystem /tmp"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={addServer}>Add</Button>
              <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {serverEntries.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <Server className="h-8 w-8" />
            <p>No MCP servers configured.</p>
          </div>
        ) : (
          serverEntries.map(([name, config]) => (
            <div key={name} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{name}</span>
                  {config.disabled && <Badge variant="outline">Disabled</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!config.disabled}
                    onCheckedChange={(v) =>
                      onChange(name, { ...config, disabled: !v })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onChange(name, null)}
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                {config.command} {config.args?.join(" ")}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
