import { NextRequest, NextResponse } from "next/server"
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs"
import { join } from "path"
import { homedir } from "os"

const SETTINGS_DIR = join(homedir(), ".qwen")
const SETTINGS_FILE = join(SETTINGS_DIR, "settings.json")

function readSettingsFile(): Record<string, unknown> {
  try {
    if (!existsSync(SETTINGS_FILE)) return {}
    return JSON.parse(readFileSync(SETTINGS_FILE, "utf-8"))
  } catch {
    return {}
  }
}

function writeSettingsFile(data: Record<string, unknown>): void {
  if (!existsSync(SETTINGS_DIR)) {
    mkdirSync(SETTINGS_DIR, { recursive: true })
  }
  writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2) + "\n", "utf-8")
}

/**
 * Deep merge: source values override target, but undefined skips.
 * Arrays are replaced, not concatenated.
 */
function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...target }
  for (const key of Object.keys(source)) {
    if (source[key] === undefined) continue
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(
        target[key] as Record<string, unknown>,
        source[key] as Record<string, unknown>
      )
    } else {
      result[key] = source[key]
    }
  }
  return result
}

/**
 * Map UI settings shape → ~/.qwen/settings.json shape.
 * UI uses a flat "mainLLM" + "providers" + "general" + "webSearch" etc.
 * The real settings.json uses nested paths: security.auth.*, openGame.providers.*, etc.
 */
function uiToFileSettings(ui: Record<string, unknown>): Record<string, unknown> {
  const mainLLM = ui.mainLLM as Record<string, unknown> | undefined
  const providers = ui.providers as Record<string, Record<string, unknown>> | undefined
  const general = ui.general as Record<string, unknown> | undefined
  const webSearch = ui.webSearch as Record<string, unknown> | undefined
  const toolFiltering = ui.toolFiltering as Record<string, unknown> | undefined
  const mcpServers = ui.mcpServers as Record<string, unknown> | undefined
  const extensions = ui.extensions as Record<string, unknown> | undefined

  const out: Record<string, unknown> = {}

  // Main LLM → security.auth + model
  if (mainLLM) {
    out.security = {
      auth: {
        selectedType: mainLLM.authType || undefined,
        apiKey: mainLLM.apiKey || undefined,
        baseUrl: mainLLM.baseUrl || undefined,
      },
    }
    if (mainLLM.model) {
      out.model = { name: mainLLM.model }
    }
  }

  // Per-modality providers → openGame.providers
  if (providers) {
    const p: Record<string, unknown> = {}
    for (const mod of ["reasoning", "image", "video", "audio"]) {
      const cfg = providers[mod]
      if (cfg && cfg.provider) {
        p[mod] = {
          provider: cfg.provider,
          apiKey: cfg.apiKey || undefined,
          baseUrl: cfg.baseUrl || undefined,
          model: cfg.model || undefined,
        }
      }
    }
    if (Object.keys(p).length > 0) {
      out.openGame = { providers: p }
    }
  }

  // General → tools.approvalMode, general.chatRecording, etc.
  if (general) {
    const g: Record<string, unknown> = {}
    if (general.chatRecording !== undefined) g.chatRecording = general.chatRecording
    if (Object.keys(g).length > 0) out.general = g

    if (general.approvalMode) {
      out.tools = { ...(out.tools as Record<string, unknown>), approvalMode: general.approvalMode }
    }
    if (general.maxSessionTurns) {
      out.model = { ...(out.model as Record<string, unknown>), maxSessionTurns: general.maxSessionTurns }
    }
  }

  // Web search
  if (webSearch) {
    out.webSearch = webSearch
  }

  // Tool filtering
  if (toolFiltering) {
    const t: Record<string, unknown> = {}
    if (toolFiltering.allowed && (toolFiltering.allowed as string[]).length > 0) {
      t.allowed = toolFiltering.allowed
    }
    if (toolFiltering.exclude && (toolFiltering.exclude as string[]).length > 0) {
      t.exclude = toolFiltering.exclude
    }
    if (Object.keys(t).length > 0) {
      out.tools = { ...(out.tools as Record<string, unknown>), ...t }
    }
  }

  // MCP servers
  if (mcpServers && Object.keys(mcpServers).length > 0) {
    out.mcpServers = mcpServers
  }

  // Extensions
  if (extensions) {
    out.extensions = extensions
  }

  return out
}

/**
 * Map ~/.qwen/settings.json shape → UI settings shape.
 */
function fileToUiSettings(file: Record<string, unknown>): Record<string, unknown> {
  const security = file.security as Record<string, unknown> | undefined
  const auth = security?.auth as Record<string, unknown> | undefined
  const model = file.model as Record<string, unknown> | undefined
  const openGame = file.openGame as Record<string, unknown> | undefined
  const ogProviders = openGame?.providers as Record<string, Record<string, unknown>> | undefined
  const general = file.general as Record<string, unknown> | undefined
  const tools = file.tools as Record<string, unknown> | undefined

  return {
    mainLLM: {
      authType: auth?.selectedType || "openai",
      apiKey: auth?.apiKey || "",
      baseUrl: auth?.baseUrl || "",
      model: model?.name || "",
    },
    providers: {
      reasoning: ogProviders?.reasoning || { provider: "", apiKey: "", baseUrl: "", model: "" },
      image: ogProviders?.image || { provider: "", apiKey: "", baseUrl: "", model: "" },
      video: ogProviders?.video || { provider: "", apiKey: "", baseUrl: "", model: "" },
      audio: ogProviders?.audio || { provider: "", apiKey: "", baseUrl: "", model: "" },
    },
    general: {
      proxy: "",
      debug: false,
      chatRecording: general?.chatRecording !== false,
      approvalMode: tools?.approvalMode || "default",
      maxSessionTurns: (model?.maxSessionTurns as number) || 100,
    },
    webSearch: file.webSearch || { provider: [], default: "dashscope" },
    toolFiltering: {
      allowed: (tools?.allowed as string[]) || [],
      exclude: (tools?.exclude as string[]) || [],
    },
    mcpServers: file.mcpServers || {},
    extensions: file.extensions || { disabled: [] },
  }
}

export async function GET() {
  try {
    const fileData = readSettingsFile()
    const uiData = fileToUiSettings(fileData)
    return NextResponse.json(uiData)
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to read settings" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const uiData = await request.json()
    const existing = readSettingsFile()
    const newFileData = uiToFileSettings(uiData)
    const merged = deepMerge(existing, newFileData)
    writeSettingsFile(merged)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to write settings" },
      { status: 500 }
    )
  }
}
