# Code structure

This extension is a **Copilot Chat language-model provider**, not a standalone chat UI. Copilot Chat calls `vscode.lm.registerLanguageModelChatProvider('openrouter-for-copilot', …)`. Chat completions go to OpenRouter `POST /api/v1/chat/completions`. Catalog comes from `GET /api/v1/models`.

Runtime details (retries, catalog TTL, vision modes): [architecture-optimizations.md](architecture-optimizations.md). User-facing vision settings: README [Attach images](../README.md#attach-images).

Build: `vite-plus` packs `src/extension.ts` → `out/extension.js` (`package.json` `"main"`). Zero runtime npm dependencies; `vscode` stays external.

## Top-level layout

```
src/
  extension.ts          activate/deactivate re-export
  runtime/              VS Code lifecycle, commands, provider registration
  provider/             LanguageModelChatProvider + request/stream/vision/tools
  client/               HTTP streaming (OpenAI default; Anthropic/Responses for custom baseUrl)
  agents/               @swarm research → review → implement
  config.ts             openrouter-for-copilot.* + legacy settings copy
  auth.ts               SecretStorage API key
  consts.ts             vendor id, secret keys, walkthrough id
  endpoint.ts           default OpenRouter URLs
  i18n.ts               UI strings (zh-CN / en)
test/                   Vitest; vscode mocked via test/support/vscode.mock.ts
scripts/                vsix install helper, catalog validator
resources/              icon, walkthrough markdown
```

The class is still named `GLMChatProvider` (`src/provider/index.ts`) — leftover from the GLM/OpenCode fork. Behavior is OpenRouter.

## Activation

`src/runtime/lifecycle.ts`:

1. `migrateLegacySettings` / `migrateLegacySecrets`
2. diagnostics, Copilot language-model defaults, MCP image store
3. `registerCommands` (logs, settings, dump folder, image cleanup)
4. `registerAgentPipeline` (`@swarm` chat participant)
5. `registerProvider` → `new GLMChatProvider` → `vscode.lm.registerLanguageModelChatProvider`

Commands that need the provider (API key, refresh models, vision proxy panel) are registered in `runtime/provider.ts`, not `runtime/commands.ts`.

## Chat request path

```
Copilot Chat
  → GLMChatProvider.provideLanguageModelChatResponse  (provider/index.ts)
      → classifyProviderRequest                       (provider/routing/)
      → resolveImageMessages                          (provider/vision/resolve.ts)
      → prepareChatRequest                            (provider/request.ts)
      → streamChatCompletion                          (provider/stream.ts)
          → client/core.ts  POST /chat/completions
      → processToolFlow                               (provider/tools/flow.ts)
```

| Path | Role |
| ---- | ---- |
| `provider/openrouter-models.ts` | Fetch/cache catalog; slug, context, pricing, `imageInput` |
| `provider/models.ts` | Map catalog → Copilot picker rows (`op: …`) |
| `provider/request.ts` | OpenAI payload: Ponytail, rules, tools, max tokens |
| `provider/stream.ts` | Stream chunks back to Copilot |
| `provider/tokens.ts` | Token estimate for the picker |
| `provider/ponytail.ts` / `rules.ts` / `think-filter.ts` / `code-simplifier.ts` | System-instruction extras |
| `provider/pricing/` | Status-bar USD/CNY estimate |
| `provider/debug/` | `debugMode` logs and verbose dumps |
| `provider/replay/` | Replay markers for tool/vision turns |

## Vision (`src/provider/vision/`)

`createVisionService` (`service.ts`) + `resolveImageMessages` (`resolve.ts`) pick a mode, then:

| Mode | Code |
| ---- | ---- |
| native | `native.ts` — resize + `image_url` bytes |
| proxy | `sources/vscode/` and `sources/endpoint/` — describe, then text to the chat model |
| mcp | `image-store.ts` + `image-capable-tools.ts` — local file + path prompt |

Protocol adapters for a custom vision endpoint: `protocols/providers/openai/` and `anthropic/`. Panel UI: `ui/panel.ts` (HTML/CSS/JS in `ui/`). Prompt text is **not** on the panel — `visionPrompt` / MCP prompts are settings (`sources/vscode/index.ts` `getVisionPrompt()`, `image-store.ts`).

## Swarm (`src/agents/` + `runtime/agent-pipeline.ts`)

Participant id: `openrouter-for-copilot.pipeline`.

`pipeline.ts`: research (`research.ts`) → review (`review.ts`) → implement (`implement.ts`) on the **currently selected** chat model. Shared tool loop: `loop.ts`. Free-tier probe when `agentRoles` is unset: `audit-free-models.ts`.

## HTTP client (`src/client/`)

Default protocol is OpenAI (`config.getApiProtocol()` → `'openai'`). `core.ts` does fetch, SSE, retries, tool-halving, overflow retry. `anthropic/` and `responses/` stay for custom `baseUrl` only.

## Tests

`test/**/*.test.ts` mirrors `src/` (e.g. `test/provider/vision/`). `vscode` is aliased to `test/support/vscode.mock.ts` in `vite.config.mts`.
