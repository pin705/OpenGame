"use client"

import { useState, useEffect, useCallback } from "react"
import {
  OpenGameSettings,
  DEFAULT_SETTINGS,
  getStoredSettings,
  storeSettings,
  MCPServerConfig,
} from "@/lib/settings"

/**
 * Sync settings to both localStorage and ~/.qwen/settings.json via API.
 */
async function syncToFile(settings: OpenGameSettings): Promise<void> {
  try {
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    })
  } catch {
    // File sync is best-effort; localStorage is primary
  }
}

/**
 * Load settings from ~/.qwen/settings.json and merge with localStorage.
 */
async function loadFromFile(): Promise<OpenGameSettings | null> {
  try {
    const res = await fetch("/api/settings")
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<OpenGameSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)

  // On mount: load from localStorage immediately, then sync from file
  useEffect(() => {
    const local = getStoredSettings()
    setSettings(local)
    setLoaded(true)

    // Try to load from file and merge
    loadFromFile().then((fileSettings) => {
      if (fileSettings) {
        setSettings((prev) => {
          const merged = { ...prev, ...fileSettings }
          storeSettings(merged)
          return merged
        })
      }
    })
  }, [])

  const updateSettings = useCallback(
    (partial: Partial<OpenGameSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...partial }
        storeSettings(next)
        syncToFile(next)
        return next
      })
    },
    []
  )

  const updateMainLLM = useCallback(
    (partial: Partial<OpenGameSettings["mainLLM"]>) => {
      setSettings((prev) => {
        const next = { ...prev, mainLLM: { ...prev.mainLLM, ...partial } }
        storeSettings(next)
        syncToFile(next)
        return next
      })
    },
    []
  )

  const updateProvider = useCallback(
    (
      modality: keyof OpenGameSettings["providers"],
      partial: Partial<OpenGameSettings["providers"]["reasoning"]>
    ) => {
      setSettings((prev) => {
        const next = {
          ...prev,
          providers: {
            ...prev.providers,
            [modality]: { ...prev.providers[modality], ...partial },
          },
        }
        storeSettings(next)
        syncToFile(next)
        return next
      })
    },
    []
  )

  const updateGeneral = useCallback(
    (partial: Partial<OpenGameSettings["general"]>) => {
      setSettings((prev) => {
        const next = { ...prev, general: { ...prev.general, ...partial } }
        storeSettings(next)
        syncToFile(next)
        return next
      })
    },
    []
  )

  const updateWebSearch = useCallback(
    (partial: Partial<OpenGameSettings["webSearch"]>) => {
      setSettings((prev) => {
        const next = { ...prev, webSearch: { ...prev.webSearch, ...partial } }
        storeSettings(next)
        syncToFile(next)
        return next
      })
    },
    []
  )

  const updateToolFiltering = useCallback(
    (partial: Partial<OpenGameSettings["toolFiltering"]>) => {
      setSettings((prev) => {
        const next = { ...prev, toolFiltering: { ...prev.toolFiltering, ...partial } }
        storeSettings(next)
        syncToFile(next)
        return next
      })
    },
    []
  )

  const updateMCPServer = useCallback(
    (name: string, config: MCPServerConfig | null) => {
      setSettings((prev) => {
        const servers = { ...prev.mcpServers }
        if (config === null) {
          delete servers[name]
        } else {
          servers[name] = config
        }
        const next = { ...prev, mcpServers: servers }
        storeSettings(next)
        syncToFile(next)
        return next
      })
    },
    []
  )

  const updateExtensions = useCallback(
    (partial: Partial<OpenGameSettings["extensions"]>) => {
      setSettings((prev) => {
        const next = { ...prev, extensions: { ...prev.extensions, ...partial } }
        storeSettings(next)
        syncToFile(next)
        return next
      })
    },
    []
  )

  return {
    settings,
    loaded,
    updateSettings,
    updateMainLLM,
    updateProvider,
    updateGeneral,
    updateWebSearch,
    updateToolFiltering,
    updateMCPServer,
    updateExtensions,
  }
}
