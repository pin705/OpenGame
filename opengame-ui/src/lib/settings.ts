/**
 * OpenGame provider configuration for a single modality.
 */
export interface ProviderConfig {
  provider: "tongyi" | "doubao" | "openai-compat" | ""
  apiKey: string
  baseUrl: string
  model: string
}

/**
 * Main LLM authentication configuration.
 */
export interface MainLLMConfig {
  authType: "openai" | "anthropic" | "qwen-oauth" | "gemini" | "vertex-ai"
  apiKey: string
  baseUrl: string
  model: string
}

/**
 * General settings.
 */
export interface GeneralConfig {
  proxy: string
  debug: boolean
  chatRecording: boolean
  approvalMode: "plan" | "default" | "auto-edit" | "yolo"
  maxSessionTurns: number
}

/**
 * Web search provider configuration.
 */
export interface WebSearchProvider {
  type: "tavily" | "google" | "dashscope"
  apiKey?: string
  searchEngineId?: string
}

export interface WebSearchConfig {
  provider: WebSearchProvider[]
  default: string
}

/**
 * Tool filtering configuration.
 */
export interface ToolFilteringConfig {
  allowed: string[]
  exclude: string[]
}

/**
 * MCP server configuration.
 */
export interface MCPServerConfig {
  command: string
  args?: string[]
  env?: Record<string, string>
  disabled?: boolean
}

/**
 * Extensions configuration.
 */
export interface ExtensionsConfig {
  disabled: string[]
}

/**
 * Full settings shape used by the UI.
 */
export interface OpenGameSettings {
  mainLLM: MainLLMConfig
  providers: {
    reasoning: ProviderConfig
    image: ProviderConfig
    video: ProviderConfig
    audio: ProviderConfig
  }
  general: GeneralConfig
  webSearch: WebSearchConfig
  toolFiltering: ToolFilteringConfig
  mcpServers: Record<string, MCPServerConfig>
  extensions: ExtensionsConfig
}

export const DEFAULT_SETTINGS: OpenGameSettings = {
  mainLLM: {
    authType: "openai",
    apiKey: "",
    baseUrl: "",
    model: "",
  },
  providers: {
    reasoning: { provider: "", apiKey: "", baseUrl: "", model: "" },
    image: { provider: "", apiKey: "", baseUrl: "", model: "" },
    video: { provider: "", apiKey: "", baseUrl: "", model: "" },
    audio: { provider: "", apiKey: "", baseUrl: "", model: "" },
  },
  general: {
    proxy: "",
    debug: false,
    chatRecording: true,
    approvalMode: "default",
    maxSessionTurns: 100,
  },
  webSearch: {
    provider: [],
    default: "dashscope",
  },
  toolFiltering: {
    allowed: [],
    exclude: [],
  },
  mcpServers: {},
  extensions: {
    disabled: [],
  },
}

const SETTINGS_KEY = "opengame-settings"

/**
 * Read settings from localStorage (client-side).
 */
export function getStoredSettings(): OpenGameSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

/**
 * Write settings to localStorage (client-side).
 */
export function storeSettings(settings: OpenGameSettings): void {
  if (typeof window === "undefined") return
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

/**
 * Build env vars object from settings for CLI spawning.
 */
export function settingsToEnvVars(settings: OpenGameSettings): Record<string, string> {
  const env: Record<string, string> = {}

  // Main LLM
  if (settings.mainLLM.apiKey) env.OPENAI_API_KEY = settings.mainLLM.apiKey
  if (settings.mainLLM.baseUrl) env.OPENAI_BASE_URL = settings.mainLLM.baseUrl
  if (settings.mainLLM.model) env.OPENAI_MODEL = settings.mainLLM.model

  // Per-modality providers
  const modalities = ["reasoning", "image", "video", "audio"] as const
  for (const mod of modalities) {
    const cfg = settings.providers[mod]
    if (!cfg.provider) continue
    const prefix = `OPENGAME_${mod.toUpperCase()}`
    env[`${prefix}_PROVIDER`] = cfg.provider
    if (cfg.apiKey) env[`${prefix}_API_KEY`] = cfg.apiKey
    if (cfg.baseUrl) env[`${prefix}_BASE_URL`] = cfg.baseUrl
    if (cfg.model) env[`${prefix}_MODEL`] = cfg.model
  }

  // General
  if (settings.general.proxy) env.HTTP_PROXY = settings.general.proxy

  return env
}

/**
 * Build CLI flags from settings for the generate command.
 */
export function settingsToCliFlags(settings: OpenGameSettings): string[] {
  const flags: string[] = []

  if (settings.general.approvalMode && settings.general.approvalMode !== "default") {
    flags.push("--approval-mode", settings.general.approvalMode)
  }
  if (settings.mainLLM.model) {
    flags.push("--model", settings.mainLLM.model)
  }
  if (settings.general.maxSessionTurns && settings.general.maxSessionTurns !== 100) {
    flags.push("--max-session-turns", String(settings.general.maxSessionTurns))
  }
  if (settings.toolFiltering.allowed.length > 0) {
    flags.push("--allowed-tools", settings.toolFiltering.allowed.join(","))
  }
  if (settings.toolFiltering.exclude.length > 0) {
    flags.push("--exclude-tools", settings.toolFiltering.exclude.join(","))
  }
  if (settings.general.debug) {
    flags.push("--debug")
  }

  return flags
}

/**
 * Check if critical providers are configured.
 */
export function getConfigStatus(settings: OpenGameSettings) {
  return {
    mainLLM: !!settings.mainLLM.apiKey,
    reasoning: !!settings.providers.reasoning.apiKey,
    image: !!settings.providers.image.apiKey,
    video: !!settings.providers.video.apiKey,
    audio: !!settings.providers.audio.apiKey,
  }
}
