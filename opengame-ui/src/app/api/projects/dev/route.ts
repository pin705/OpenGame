import { NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import { existsSync } from "fs"
import { join } from "path"

export async function POST(request: NextRequest) {
  const { path: projectPath } = await request.json()

  if (!projectPath) {
    return NextResponse.json({ error: "Project path is required" }, { status: 400 })
  }

  if (!existsSync(projectPath)) {
    return NextResponse.json({ error: "Project path does not exist" }, { status: 404 })
  }

  const packageJsonPath = join(projectPath, "package.json")
  if (!existsSync(packageJsonPath)) {
    return NextResponse.json({ error: "No package.json found in project" }, { status: 400 })
  }

  try {
    // Check if node_modules exists, install if not
    const nodeModulesPath = join(projectPath, "node_modules")
    if (!existsSync(nodeModulesPath)) {
      await new Promise<void>((resolve, reject) => {
        const install = spawn("npm", ["install"], {
          cwd: projectPath,
          shell: true,
          stdio: "ignore",
        })
        install.on("close", (code) => {
          if (code === 0) resolve()
          else reject(new Error(`npm install failed with code ${code}`))
        })
      })
    }

    // Start dev server in background
    const dev = spawn("npm", ["run", "dev"], {
      cwd: projectPath,
      shell: true,
      stdio: "ignore",
      detached: true,
    })
    dev.unref()

    // Vite default port is 5173
    const port = 5173
    const url = `http://localhost:${port}`

    return NextResponse.json({ url, pid: dev.pid })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to start dev server" },
      { status: 500 }
    )
  }
}
