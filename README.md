<h1 align="center">OpenRouter for Copilot Chat</h1>

<p align="center">
  <!-- marketplace-readme:remove-start -->
  <img src="https://img.shields.io/badge/OpenRouter-BYOK-007ACC?logo=visualstudiocode&logoColor=white&style=for-the-badge" alt="OpenRouter BYOK" />
  <br/>
  <img src="https://img.shields.io/github/v/release/abbalochdev/openrouter-for-copilot?style=for-the-badge&label=Version" alt="Version" />
  <img src="https://img.shields.io/badge/models-400+-blue?style=for-the-badge" alt="400+ models" />
  <img src="https://img.shields.io/badge/dependencies-zero-success?style=for-the-badge" alt="Zero runtime dependencies" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="MIT License" />
  <!-- marketplace-readme:remove-end -->
</p>

<p align="center">
  <b>400+ OpenRouter models in Copilot Chat's model picker — BYOK, vision proxy, reasoning models, and an @swarm multi-agent pipeline.</b>
</p>

<p align="center">
  <img src="resources/screenshots/01-picker.png" alt="OpenRouter models in the Copilot Chat model picker" width="800">
</p>

## Quick Start

1. Create a key at [openrouter.ai/keys](https://openrouter.ai/keys).
2. Run **OpenRouter: Set API Key** (stored in OS keychain via VS Code SecretStorage).
3. Pick an OpenRouter model in Copilot Chat, or type `@swarm`.

## What it does

- Registers vendor **`openrouter-for-copilot`** in Copilot Chat (display name OpenRouter) — no new sidebar or chat UI.
- Fetches the live catalog from OpenRouter (`GET /api/v1/models`).
- Sends chat requests to `https://openrouter.ai/api/v1/chat/completions` (OpenAI-compatible).
- Keeps Copilot agent mode, tools, MCP, instructions, and skills on your OpenRouter account.

<p align="center">
  <img src="resources/screenshots/04-agent.png" alt="OpenRouter model running Copilot agent mode" width="800">
</p>

## Commands

| Command | Action |
| ------- | ------ |
| **OpenRouter: Set API Key** | Store your OpenRouter key |
| **OpenRouter: Clear API Key** | Remove stored key |
| **OpenRouter: Open API Key Page** | Open openrouter.ai/keys |
| **OpenRouter: Query Usage** | Open openrouter.ai/activity |
| **OpenRouter: Refresh Model List** | Re-fetch catalog from OpenRouter |
| **OpenRouter: Configure Vision Proxy** | Vision source (auto / VS Code LM / custom endpoint) |
| **OpenRouter: Set Ponytail Mode** | Coding-discipline intensity |
| **OpenRouter: Toggle Code Simplifier** | Post-edit simplification on/off |
| **OpenRouter: Open Settings** | Jump to extension settings |
| **OpenRouter: Show Logs** | Output channel (metadata mode) |
| **OpenRouter: Show Runtime Diagnostics** | Runtime report |
| **OpenRouter: Open Request Dumps Folder** | Verbose request dumps |

## Features

### Agent Swarm (`@swarm`)

Parallel research → pre-implementation review → implementation on **your selected chat model**.

When `agentRoles` is unset, the swarm probes OpenRouter `:free` models at startup of each run and routes research, review, and implement-fallback through the fastest responders. Pin roles in settings to override.

### Vision proxy

Automatic mode calls OpenRouter with `google/gemini-2.0-flash-001`, then falls back to a VS Code vision model. Configure via **OpenRouter: Configure Vision Proxy**.

<p align="center">
  <img src="resources/screenshots/03-vision.png" alt="Vision proxy in Copilot Chat" width="800">
</p>

### Reasoning / thinking

Models that advertise `reasoning_effort` in the OpenRouter catalog expose effort controls in Copilot's model menu.

### Ponytail & Code Simplifier

- **Ponytail** — lazy-senior-dev system instruction (`ponytailMode`, default `full`).
- **Code Simplifier** — auto-refines recent edits (default on; lowers Ponytail to Lite when both active).

## Prerequisites

- VS Code **1.116+**
- GitHub Copilot subscription
- OpenRouter account + API key

## Installation

- **Marketplace:** `abbalochdev.openrouter-for-copilot` (when published)
- **Open VSX:** same extension ID
- **From source:** `pnpm install && pnpm compile` → Extension Development Host

## Models

Picker IDs are OpenRouter slugs (`provider/model`). Browse [openrouter.ai/models](https://openrouter.ai/models).

| Slug | Notes |
| ---- | ----- |
| `anthropic/claude-3.5-sonnet` | Strong general coding |
| `deepseek/deepseek-chat` | Fast, economical; default utility alias target |
| `google/gemini-2.0-flash-001` | Multimodal; default vision proxy |
| `openai/gpt-4o-mini` | Compact general-purpose |
| `meta-llama/llama-3.3-70b-instruct:free` | `:free` tier |

## Settings

All keys live under **`openrouter-for-copilot.*`**:

| Setting | Default | Description |
| ------- | ------- | ----------- |
| `baseUrl` | empty | Override API base; empty → `https://openrouter.ai/api/v1` |
| `maxTokens` | `0` | Max output tokens (`0` = unset) |
| `modelIdOverrides` | utility → `deepseek/deepseek-chat` | Remap picker IDs to API slugs |
| `customModels` | `[]` | Extra slugs or custom model objects |
| `agentRoles` | `{}` | Swarm: `research`, `review`, `implementFallback` |
| `visionModel` | empty | VS Code vision fallback (`vendor/id`) |
| `visionPrompt` | built-in | Image description prompt |
| `ponytailMode` | `full` | `off` / `lite` / `full` / `ultra` |
| `codeSimplifier` | `true` | Post-edit simplification |
| `stripThinkTags` | `auto` | Strip leaked reasoning tags |
| `rules` | `[]` | User rules on coding requests |
| `allowExtraTools` | `false` | Forward MCP tools to swarm (experimental) |
| `auditFreeModelProbeMs` | `6000` | Swarm free-model probe timeout (500–30000) |
| `debugMode` | `minimal` | `minimal` / `metadata` / `verbose` |
| `experimental.stabilizeToolList` | `false` | Experimental tool-list stabilization |

```json
{
  "openrouter-for-copilot.customModels": ["mistralai/mistral-small-3.1-24b-instruct:free"],
  "openrouter-for-copilot.agentRoles": {
    "research": [{ "vendor": "openrouter-for-copilot", "family": "meta-llama", "id": "meta-llama/llama-3.3-70b-instruct:free" }]
  }
}
```

Changing `customModels`, `modelIdOverrides`, or `baseUrl` refreshes the picker without restarting VS Code.

## Troubleshooting

### Models missing in agent / background agent window

```json
{
  "extensions.supportAgentsWindow": {
    "abbalochdev.openrouter-for-copilot": true
  }
}
```

### HTTP 402 — insufficient credits

Add credits at [openrouter.ai/activity](https://openrouter.ai/activity) or use a `:free` slug. Run **OpenRouter: Query Usage**.

### HTTP 404 — model not found

Run **OpenRouter: Refresh Model List** and pick a current slug.

### Utility model BYOK error

Known VS Code regression when main model is BYOK — [microsoft/vscode#324007](https://github.com/microsoft/vscode/issues/324007). Default `modelIdOverrides` map `copilot-utility*` to `deepseek/deepseek-chat`.

## Migrating from OpenCode / GLM forks

One-time copy of `opencode-for-copilot.*` settings and legacy secret keys. OpenCode model IDs and endpoint presets do not carry over — pick OpenRouter slugs instead. Details: [docs/porting-roadmap.md](docs/porting-roadmap.md).

## Acknowledgements

Fork lineage: [GLM for VS Code Copilot](https://github.com/umbrella22/glm-for-copilot) → [OpenCode for Copilot](https://github.com/abbalochdev/opencode-for-copilot) → OpenRouter for Copilot. MIT License.

## License

[MIT](LICENSE)
