"use client"

import { useSettings } from "@/hooks/use-settings"
import { MainLLMSettings } from "@/components/settings/main-llm"
import { ProviderConfigCard } from "@/components/settings/provider-config"
import { GeneralSettings } from "@/components/settings/general"
import { WebSearchSettings } from "@/components/settings/web-search"
import { ToolFilteringSettings } from "@/components/settings/tool-filtering"
import { MCPServersSettings } from "@/components/settings/mcp-servers"
import { ExtensionsSettings } from "@/components/settings/extensions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Brain,
  ImageIcon,
  Video,
  AudioLines,
  Settings2,
  CheckCircle2,
  AlertCircle,
  Globe,
  Wrench,
  Server,
  Puzzle,
} from "lucide-react"

function ConfigStatus({ configured }: { configured: boolean }) {
  return configured ? (
    <Badge variant="default" className="ml-2 gap-1 bg-green-600">
      <CheckCircle2 className="h-3 w-3" />
      Configured
    </Badge>
  ) : (
    <Badge variant="outline" className="ml-2 gap-1 text-muted-foreground">
      <AlertCircle className="h-3 w-3" />
      Not Set
    </Badge>
  )
}

export default function SettingsPage() {
  const {
    settings,
    loaded,
    updateMainLLM,
    updateProvider,
    updateGeneral,
    updateWebSearch,
    updateToolFiltering,
    updateMCPServer,
    updateExtensions,
  } = useSettings()

  if (!loaded) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const mainConfigured = !!settings.mainLLM.apiKey

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure API keys, models, agent behavior, and tools.
        </p>
      </div>

      <Separator />

      <Tabs defaultValue="main" className="space-y-4">
        <TabsList className="flex w-full flex-wrap">
          <TabsTrigger value="main" className="gap-1.5">
            <Settings2 className="h-4 w-4" />
            Main LLM
            <ConfigStatus configured={mainConfigured} />
          </TabsTrigger>
          <TabsTrigger value="reasoning" className="gap-1.5">
            <Brain className="h-4 w-4" />
            Reasoning
          </TabsTrigger>
          <TabsTrigger value="image" className="gap-1.5">
            <ImageIcon className="h-4 w-4" />
            Image
          </TabsTrigger>
          <TabsTrigger value="video" className="gap-1.5">
            <Video className="h-4 w-4" />
            Video
          </TabsTrigger>
          <TabsTrigger value="audio" className="gap-1.5">
            <AudioLines className="h-4 w-4" />
            Audio
          </TabsTrigger>
          <TabsTrigger value="websearch" className="gap-1.5">
            <Globe className="h-4 w-4" />
            Web Search
          </TabsTrigger>
          <TabsTrigger value="tools" className="gap-1.5">
            <Wrench className="h-4 w-4" />
            Tools
          </TabsTrigger>
          <TabsTrigger value="mcp" className="gap-1.5">
            <Server className="h-4 w-4" />
            MCP
          </TabsTrigger>
          <TabsTrigger value="extensions" className="gap-1.5">
            <Puzzle className="h-4 w-4" />
            Extensions
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-1.5">
            <Settings2 className="h-4 w-4" />
            General
          </TabsTrigger>
        </TabsList>

        <TabsContent value="main">
          <MainLLMSettings
            config={settings.mainLLM}
            onChange={updateMainLLM}
          />
        </TabsContent>

        <TabsContent value="reasoning">
          <ProviderConfigCard
            title="Reasoning Provider"
            description="Used by game-type classifier, GDD generator, and ABC music synthesis."
            config={settings.providers.reasoning}
            onChange={(p) => updateProvider("reasoning", p)}
          />
        </TabsContent>

        <TabsContent value="image">
          <ProviderConfigCard
            title="Image Generation"
            description="Generates sprites, backgrounds, tilesets, and animation base frames."
            config={settings.providers.image}
            onChange={(p) => updateProvider("image", p)}
          />
        </TabsContent>

        <TabsContent value="video">
          <ProviderConfigCard
            title="Video Generation"
            description="Image-to-video for animation frames. Only Tongyi and Doubao supported."
            config={settings.providers.video}
            onChange={(p) => updateProvider("video", p)}
            supportedProviders={["tongyi", "doubao"]}
          />
        </TabsContent>

        <TabsContent value="audio">
          <ProviderConfigCard
            title="Audio Generation"
            description="LLM writes ABC music notation; WAV rendered locally via symusic."
            config={settings.providers.audio}
            onChange={(p) => updateProvider("audio", p)}
          />
        </TabsContent>

        <TabsContent value="websearch">
          <WebSearchSettings
            config={settings.webSearch}
            onChange={updateWebSearch}
          />
        </TabsContent>

        <TabsContent value="tools">
          <ToolFilteringSettings
            config={settings.toolFiltering}
            onChange={updateToolFiltering}
          />
        </TabsContent>

        <TabsContent value="mcp">
          <MCPServersSettings
            servers={settings.mcpServers}
            onChange={updateMCPServer}
          />
        </TabsContent>

        <TabsContent value="extensions">
          <ExtensionsSettings
            config={settings.extensions}
            onChange={updateExtensions}
          />
        </TabsContent>

        <TabsContent value="general">
          <GeneralSettings
            config={settings.general}
            onChange={updateGeneral}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
