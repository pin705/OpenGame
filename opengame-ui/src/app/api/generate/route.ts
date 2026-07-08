import { NextRequest } from "next/server"
import { spawn } from "child_process"
import { readFileSync, existsSync } from "fs"
import { join } from "path"
import { homedir } from "os"

/**
 * Read settings from ~/.qwen/settings.json (written by /api/settings PUT).
 */
function readSettingsFile(): Record<string, unknown> {
  try {
    const p = join(homedir(), ".qwen", "settings.json")
    if (!existsSync(p)) return {}
    return JSON.parse(readFileSync(p, "utf-8"))
  } catch {
    return {}
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { prompt, ...options } = body

  if (!prompt) {
    return new Response(JSON.stringify({ error: "Prompt is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  // Build CLI arguments
  const args: string[] = []
  args.push(prompt)

  // From form options (override everything)
  if (options["approval-mode"]) {
    args.push("--approval-mode", options["approval-mode"])
  }
  if (options["model"]) {
    args.push("--model", options["model"])
  }
  if (options["sandbox"] === "true") {
    args.push("--sandbox")
  }
  if (options["max-session-turns"]) {
    args.push("--max-session-turns", options["max-session-turns"])
  }

  // Output format for streaming
  args.push("--output-format", "stream-json")

  // Build env
  const env = { ...process.env }

  // Parse settings from X-Settings header (UI state)
  let uiSettings: Record<string, unknown> = {}
  try {
    const settingsHeader = request.headers.get("x-settings")
    if (settingsHeader) {
      uiSettings = JSON.parse(settingsHeader)

      // Main LLM env vars
      const mainLLM = uiSettings.mainLLM as Record<string, unknown> | undefined
      if (mainLLM?.apiKey) env.OPENAI_API_KEY = mainLLM.apiKey as string
      if (mainLLM?.baseUrl) env.OPENAI_BASE_URL = mainLLM.baseUrl as string
      if (mainLLM?.model) env.OPENAI_MODEL = mainLLM.model as string

      // Per-modality provider env vars
      const providers = uiSettings.providers as Record<string, Record<string, unknown>> | undefined
      if (providers) {
        for (const mod of ["reasoning", "image", "video", "audio"]) {
          const cfg = providers[mod]
          if (!cfg?.provider) continue
          const prefix = `OPENGAME_${mod.toUpperCase()}`
          env[`${prefix}_PROVIDER`] = cfg.provider as string
          if (cfg.apiKey) env[`${prefix}_API_KEY`] = cfg.apiKey as string
          if (cfg.baseUrl) env[`${prefix}_BASE_URL`] = cfg.baseUrl as string
          if (cfg.model) env[`${prefix}_MODEL`] = cfg.model as string
        }
      }

      // Tool filtering CLI flags from UI
      const toolFiltering = uiSettings.toolFiltering as Record<string, unknown> | undefined
      if (toolFiltering) {
        const allowed = toolFiltering.allowed as string[] | undefined
        if (allowed && allowed.length > 0) {
          args.push("--allowed-tools", ...allowed)
        }
        const exclude = toolFiltering.exclude as string[] | undefined
        if (exclude && exclude.length > 0) {
          args.push("--exclude-tools", ...exclude)
        }
      }
    }
  } catch {
    // ignore parse errors
  }

  // Also read from ~/.qwen/settings.json for any remaining CLI flags
  // that may not have been passed via X-Settings (e.g. extensions, mcp)
  const fileSettings = readSettingsFile()

  // Extensions
  const extensions = fileSettings.extensions as Record<string, unknown> | undefined
  const disabledExt = extensions?.disabled as string[] | undefined
  if (disabledExt && disabledExt.length > 0) {
    // CLI uses --extensions to list extensions to include;
    // disabling is handled via settings.json, no CLI flag needed.
  }

  // Resolve CLI path
  let cliCmd = "opengame"
  let cliArgs = args

  const { execSync } = require("child_process")
  try {
    execSync("which opengame", { stdio: "ignore" })
  } catch {
    try {
      const opengameDir = process.env.OPENGAME_DIR || "../"
      const distPath = `${opengameDir}dist/cli.js`
      cliCmd = "node"
      cliArgs = [distPath, ...args]
    } catch {
      return new Response(
        JSON.stringify({ error: "OpenGame CLI not found" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }
  }

  // SSE stream
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      const send = (type: string, content: string) => {
        const data = JSON.stringify({ type, content })
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))
      }

      send("info", `Launching: ${cliCmd} ${cliArgs.join(" ")}`)

      const child = spawn(cliCmd, cliArgs, {
        env,
        stdio: ["pipe", "pipe", "pipe"],
        shell: true,
      })

      let buffer = ""

      child.stdout.on("data", (chunk: Buffer) => {
        buffer += chunk.toString()
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const data = JSON.parse(line)
            if (data.type === "tool_use" || data.type === "tool_call") {
              send("tool", `[${data.name || "tool"}] ${JSON.stringify(data.input || data.args || {}, null, 2)}`)
            } else if (data.type === "text" || data.type === "content") {
              send("output", data.text || data.content || line)
            } else if (data.type === "assistant" || data.role === "assistant") {
              send("output", data.content || data.text || JSON.stringify(data))
            } else {
              send("output", line)
            }
          } catch {
            send("output", line)
          }
        }
      })

      child.stderr.on("data", (chunk: Buffer) => {
        send("info", chunk.toString().trim())
      })

      child.on("close", (code) => {
        if (code === 0) {
          send("done", "Generation completed successfully.")
        } else {
          send("error", `Process exited with code ${code}`)
        }
        controller.close()
      })

      child.on("error", (err) => {
        send("error", `Failed to start CLI: ${err.message}`)
        controller.close()
      })

      request.signal.addEventListener("abort", () => {
        child.kill("SIGTERM")
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
