"use client"

import { useState, useEffect, useCallback } from "react"
import {
  OpenGameSettings,
  DEFAULT_SETTINGS,
  getStoredSettings,
  storeSettings,
} from "@/lib/settings"

export function useSettings() {
  const [settings, setSettings] = useState<OpenGameSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setSettings(getStoredSettings())
    setLoaded(true)
  }, [])

  const updateSettings = useCallback(
    (partial: Partial<OpenGameSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...partial }
        storeSettings(next)
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
  }
}
