"use client"

import { useState, useCallback, useRef } from "react"
import { getStoredSettings } from "@/lib/settings"

export interface StreamMessage {
  id: string
  type: "info" | "tool" | "output" | "error" | "done"
  content: string
  timestamp: number
}

export function useStream() {
  const [messages, setMessages] = useState<StreamMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const startStream = useCallback(
    async (prompt: string, options: Record<string, string> = {}) => {
      // Reset
      setMessages([])
      setIsStreaming(true)
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const settings = getStoredSettings()
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Settings": JSON.stringify(settings),
          },
          body: JSON.stringify({ prompt, ...options }),
          signal: controller.signal,
        })

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        }

        const reader = res.body?.getReader()
        if (!reader) throw new Error("No response body")

        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6))
                setMessages((prev) => [
                  ...prev,
                  {
                    id: `${Date.now()}-${Math.random()}`,
                    type: data.type || "output",
                    content: data.content || "",
                    timestamp: Date.now(),
                  },
                ])
              } catch {
                // skip malformed lines
              }
            }
          }
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `done-${Date.now()}`,
            type: "done",
            content: "Generation complete.",
            timestamp: Date.now(),
          },
        ])
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            type: "error",
            content: err instanceof Error ? err.message : "Unknown error",
            timestamp: Date.now(),
          },
        ])
      } finally {
        setIsStreaming(false)
        abortRef.current = null
      }
    },
    []
  )

  const stopStream = useCallback(() => {
    abortRef.current?.abort()
    setIsStreaming(false)
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return { messages, isStreaming, startStream, stopStream, clearMessages }
}
