"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Gamepad2,
  Play,
  Trash2,
  Search,
  FolderOpen,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"

interface Project {
  name: string
  path: string
  addedAt: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [search, setSearch] = useState("")
  const [starting, setStarting] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem("opengame-projects")
      if (raw) setProjects(JSON.parse(raw))
    } catch {
      // ignore
    }
  }, [])

  const saveProjects = (list: Project[]) => {
    setProjects(list)
    localStorage.setItem("opengame-projects", JSON.stringify(list))
    localStorage.setItem(
      "opengame-recent-projects",
      JSON.stringify(list.map((p) => p.name))
    )
  }

  const addProject = () => {
    const name = prompt("Project name:")
    const path = prompt("Project path (absolute):")
    if (!name || !path) return
    saveProjects([
      ...projects,
      { name, path, addedAt: new Date().toISOString() },
    ])
    toast.success(`Project "${name}" added`)
  }

  const removeProject = (name: string) => {
    saveProjects(projects.filter((p) => p.name !== name))
    toast.success(`Project "${name}" removed`)
  }

  const startDevServer = async (project: Project) => {
    setStarting(project.name)
    try {
      const res = await fetch("/api/projects/dev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: project.path }),
      })
      const data = await res.json()
      if (data.url) {
        toast.success(`Dev server started at ${data.url}`)
        window.open(data.url, "_blank")
      } else {
        toast.error(data.error || "Failed to start dev server")
      }
    } catch (err) {
      toast.error("Failed to start dev server")
    } finally {
      setStarting(null)
    }
  }

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.path.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage your generated game projects.
          </p>
        </div>
        <Button onClick={addProject}>
          <FolderOpen className="mr-2 h-4 w-4" />
          Add Project
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects..."
          className="pl-9"
        />
      </div>

      {/* Project list */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Gamepad2 className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              {projects.length === 0
                ? "No projects yet. Create a game or add an existing project."
                : "No projects match your search."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <Card key={project.name}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{project.name}</CardTitle>
                    <CardDescription className="mt-1 break-all text-xs">
                      {project.path}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    {new Date(project.addedAt).toLocaleDateString()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => startDevServer(project)}
                  disabled={starting === project.name}
                >
                  <Play className="mr-1 h-3 w-3" />
                  {starting === project.name ? "Starting..." : "Run Dev"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`vscode://file/${project.path}`, "_blank")}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => removeProject(project.name)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
