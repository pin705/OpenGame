import { NextRequest } from "next/server"
import { spawn } from "child_process"

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

  // Prompt (use positional argument, modern CLI style)
  args.push(prompt)

  // Approval mode
  if (options["approval-mode"]) {
    args.push("--approval-mode", options["approval-mode"])
  }

  // Model
  if (options["model"]) {
    args.push("--model", options["model"])
  }

  // Sandbox
  if (options["sandbox"] === "true") {
    args.push("--sandbox")
  }

  // Max session turns
  if (options["max-session-turns"]) {
    args.push("--max-session-turns", options["max-session-turns"])
  }

  // Output format for streaming
  args.push("--output-format", "stream-json")

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      const send = (type: string, content: string) => {
        const data = JSON.stringify({ type, content })
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))
      }

      // Try to find opengame CLI
      const cliPaths = ["opengame", "npx", "node"]

      // Build env from request headers (settings passed from client)
      const env = { ...process.env }

      // The client passes settings via X-Settings header
      try {
        const settingsHeader = request.headers.get("x-settings")
        if (settingsHeader) {
          const settings = JSON.parse(settingsHeader)

          // Main LLM
          if (settings.mainLLM?.apiKey) env.OPENAI_API_KEY = settings.mainLLM.apiKey
          if (settings.mainLLM?.baseUrl) env.OPENAI_BASE_URL = settings.mainLLM.baseUrl
          if (settings.mainLLM?.model) env.OPENAI_MODEL = settings.mainLLM.model

          // Per-modality providers
          const modalities = ["reasoning", "image", "video", "audio"] as const
          for (const mod of modalities) {
            const cfg = settings.providers?.[mod]
            if (!cfg?.provider) continue
            const prefix = `OPENGAME_${mod.toUpperCase()}`
            env[`${prefix}_PROVIDER`] = cfg.provider
            if (cfg.apiKey) env[`${prefix}_API_KEY`] = cfg.apiKey
            if (cfg.baseUrl) env[`${prefix}_BASE_URL`] = cfg.baseUrl
            if (cfg.model) env[`${prefix}_MODEL`] = cfg.model
          }
        }
      } catch {
        // ignore parse errors
      }

      // Resolve CLI path
      let cliCmd = "opengame"
      let cliArgs = args

      // Check if opengame is available
      const { execSync } = require("child_process")
      try {
        execSync("which opengame", { stdio: "ignore" })
      } catch {
        // Try npx
        try {
          const opengameDir = process.env.OPENGAME_DIR || "../"
          const distPath = `${opengameDir}dist/cli.js`
          cliCmd = "node"
          cliArgs = [distPath, ...args]
        } catch {
          send("error", "OpenGame CLI not found. Install it or set OPENGAME_DIR.")
          controller.close()
          return
        }
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
            // Try to parse as JSON (stream-json format)
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
            // Plain text output
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

      // Handle abort
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
