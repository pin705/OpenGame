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
 * Full settings shape matching ~/.qwen/settings.json structure.
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
