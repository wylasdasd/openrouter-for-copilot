# Migration from OpenCode / GLM forks

> OpenRouter for Copilot v3.11.14

Fork of the [OpenCode for Copilot](https://github.com/Abbalochdev/opencode-for-copilot) lineage, retargeted to the [OpenRouter API](https://openrouter.ai/docs).

---

## What changed

| Surface | OpenCode era | OpenRouter (now) |
| ------- | ------------ | ---------------- |
| Settings | `opencode-for-copilot.*` | `openrouter-for-copilot.*` |
| Vendor | `opencode` | `openrouter-for-copilot` |
| Catalog | Go/Zen OpenCode APIs | `GET openrouter.ai/api/v1/models` |
| Model IDs | Bare IDs + billing prefix | Slugs (`provider/model`) |
| Endpoint presets | Go / Zen / Anthropic | None — single OpenAI-compatible base URL |
| Default base URL | Plan-dependent | `https://openrouter.ai/api/v1` |
| API key | opencode.ai/auth | openrouter.ai/keys |
| Usage | OpenCode console | openrouter.ai/activity |
| Swarm participant | `opencode-for-copilot.pipeline` | `openrouter-for-copilot.pipeline` |

---

## Automatic settings migration

On first activation, user-set values copy from `opencode-for-copilot.*` → `openrouter-for-copilot.*` **only when the target key has no value yet**.

Migrated keys:

- `agentRoles`, `baseUrl`, `maxTokens`, `experimental.stabilizeToolList`
- `modelIdOverrides`, `customModels`, `visionModel`, `visionPrompt`
- `debugMode`, `ponytailMode`, `codeSimplifier`, `stripThinkTags`
- `apiKey` (settings fallback — primary storage is SecretStorage)
- `endpoint` (copied if present, but **no longer read** by this extension)

**Not migrated:** `rules`, `allowExtraTools`, `auditFreeModelProbeMs`, `visionMode`, `imageHandlingPrompt`, `imageStoredPrompt`, `mcp.imageCleanupMode`, `mcp.imageCapableTools` — set these manually if needed. Vision routing is documented in the README **Attach images** section.

---

## Automatic secret migration

First activation copies the first non-empty legacy secret into `openrouter-for-copilot.apiKey`:

- `glm-copilot.apiKey`
- `glm-copilot.apiKey.go`
- `glm-copilot.apiKey.zen`

---

## User checklist

1. Create an OpenRouter key at [openrouter.ai/keys](https://openrouter.ai/keys).
2. Run **OpenRouter: Set API Key** (or rely on migrated secret).
3. Run **OpenRouter: Refresh Model List**.
4. Re-pick models — OpenCode bare IDs (e.g. `glm-5.2`) do not exist on OpenRouter.
5. Re-type `@swarm` (participant ID changed).

---

## Side-by-side install

| Extension | Settings | Vendor |
| --------- | -------- | ------ |
| OpenRouter for Copilot | `openrouter-for-copilot.*` | `openrouter-for-copilot` |
| OpenCode for Copilot | `opencode-for-copilot.*` | `opencode` |
| GLM for VS Code Copilot | `glm-copilot.*` | `glm` |

---

## Removed

- `endpoint`, `opencodePlan`, `showProviderPrefix` settings
- `opencode-models.ts` catalog fetcher
- OpenCode Go/Zen dual-catalog merge

---

## Lineage

1. [GLM for VS Code Copilot](https://github.com/umbrella22/glm-for-copilot)
2. [OpenCode for Copilot](https://github.com/Abbalochdev/opencode-for-copilot)
3. **OpenRouter for Copilot** (this repo)

Thanks and what was borrowed: [acknowledgements.md](acknowledgements.md).

Pre-3.11.14 changelog: that project's `CHANGELOG.md`.
