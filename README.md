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
  <a href="README.zh-cn.md">简体中文</a>
</p>

Use **400+ OpenRouter models** in GitHub Copilot Chat's model picker — BYOK, agent mode, vision (native / proxy / mcp), reasoning controls, and an `@swarm` multi-agent pipeline. No extra chat UI; everything runs inside Copilot Chat.

## Requirements

| Item | Version |
| ---- | ------- |
| VS Code | 1.116+ |
| GitHub Copilot | Active subscription |
| OpenRouter | Account + API key |

## Installation

**Marketplace / Open VSX:** search for `abbalochdev.openrouter-for-copilot`, or install from the [Releases](https://github.com/abbalochdev/openrouter-for-copilot/releases) page.

**From source:**

```bash
pnpm install
pnpm compile
```

Press **F5** to launch the Extension Development Host, or run `pnpm package` to build a `.vsix`.

## Quick start

1. Create an API key at [openrouter.ai/keys](https://openrouter.ai/keys).
2. Open the Command Palette and run **OpenRouter: Set API Key**. The key is stored in VS Code SecretStorage (OS keychain), not in `settings.json`.
3. Open Copilot Chat, click the model picker, and choose a model under vendor **OpenRouter** (IDs look like `op: deepseek/deepseek-chat`).
4. Chat as usual — agent mode, tools, MCP, instructions, and skills work on your OpenRouter account.

If models do not appear:

1. Confirm the API key is set.
2. Run **OpenRouter: Refresh Model List**.
3. Open **Chat: Manage Language Models** (`workbench.action.chat.manage`) and ensure OpenRouter models are visible.

## Features

The extension registers vendor **`openrouter-for-copilot`** (display name OpenRouter) inside Copilot Chat — no extra sidebar or chat window.

### Models & connectivity

| Feature | Description |
| ------- | ----------- |
| **OpenRouter BYOK** | Bring your own API key; billed at OpenRouter rates, not Copilot model quota |
| **400+ model catalog** | Fetched live from `GET /api/v1/models` and shown in the model picker |
| **Native Copilot Chat integration** | Works in the existing picker, agent mode, and tool panel — no UI switch |
| **Custom models** | `customModels` adds slugs or full model objects (name, token limits, tool calling, `imageInput`, etc.) |
| **Model ID overrides** | `modelIdOverrides` remaps picker IDs to different API slugs (including Copilot utility aliases) |
| **Endpoint override** | `baseUrl` can point to any OpenAI Chat Completions-compatible proxy or gateway |

### Copilot capabilities preserved

| Feature | Description |
| ------- | ----------- |
| **Agent mode** | Read files, edit code, run terminal, apply patch — full Copilot agent tooling |
| **MCP tools** | MCP servers you configure in VS Code are forwarded with chat requests |
| **Instructions / Skills** | Copilot user instructions and skills continue to apply |
| **Utility models** | Background tasks (titles, commit messages, etc.) default to `deepseek/deepseek-chat` |

### Multimodal & reasoning

| Feature | Description |
| ------- | ----------- |
| **Vision: native / proxy / mcp** | Models that accept images get resized bytes (2.5 MiB budget). Text-only models use a vision proxy (OpenRouter Gemini Flash → VS Code fallback). Optional `mcp` stores files for an image-capable MCP tool. |
| **Reasoning effort** | Models with `reasoning_effort` in the catalog expose depth controls in Copilot's model menu |
| **Think-tag filtering** | `stripThinkTags` removes leaked reasoning tags from visible output (e.g. MiniMax think blocks) |

### Agent Swarm (`@swarm`)

| Feature | Description |
| ------- | ----------- |
| **Three-stage pipeline** | Parallel Research → Review → Implement on **your selected chat model** |
| **Context forwarding** | Receives `@file` references, URLs, symbol ranges, and editor selections |
| **Free-model audit** | When `agentRoles` is unset, probes `:free` models each run and assigns roles by latency |
| **Implement fallback** | Tries `implementFallback` models when the primary model hits 429/5xx |
| **MCP extension (experimental)** | `allowExtraTools` forwards MCP tools to swarm agents |

### Coding assistants

| Feature | Description |
| ------- | ----------- |
| **Ponytail mode** | Injects lazy-senior-dev system instruction (`off` / `lite` / `full` / `ultra`) |
| **Code Simplifier** | Auto-refines recent edits after changes for clarity and consistency |
| **User rules** | `rules` array injects a `### USER RULES` block for project conventions (coding requests only) |

### Cost & debugging

| Feature | Description |
| ------- | ----------- |
| **Token usage reporting** | Reports usage to Copilot when the API returns it |
| **Cost estimate** | Status bar shows today / month OpenRouter cost estimates |
| **Three debug levels** | `debugMode`: `minimal` (usage only) / `metadata` (privacy-safe logs) / `verbose` (full request dumps) |
| **Runtime diagnostics** | **OpenRouter: Show Runtime Diagnostics** generates an extension status report |

## Daily use

### Pick a model

Model picker IDs are OpenRouter slugs (`provider/model`), prefixed with `op:` so they stay distinct from Copilot's built-in BYOK entries. Browse the live catalog at [openrouter.ai/models](https://openrouter.ai/models).

| Slug | Good for |
| ---- | -------- |
| `deepseek/deepseek-chat` | Fast, economical coding (default utility alias target) |
| `anthropic/claude-3.5-sonnet` | Strong general coding |
| `google/gemini-2.0-flash-001` | Multimodal; default vision proxy |
| `openai/gpt-4o-mini` | Compact general-purpose |
| `meta-llama/llama-3.3-70b-instruct:free` | Free tier (`:free` suffix) |

Add your own slugs via `openrouter-for-copilot.customModels` — the picker refreshes without restarting VS Code.

### Agent mode

Select any OpenRouter model that supports tool calling, switch Copilot Chat to **Agent**, and use it like a native Copilot model. Requests go to `https://openrouter.ai/api/v1/chat/completions` (OpenAI-compatible).

### Attach images

Routing follows [GLM for Copilot](https://github.com/umbrella22/GLM-for-copilot). Attach a screenshot or photo in Copilot Chat (paperclip / drag-and-drop) and send — no extra sidebar.

**Default (`visionMode`: `auto`)**

| Selected model | What happens |
| -------------- | ------------ |
| Catalog says it accepts images | **native** — resize (VS Code `_chat.resizeImage`) and send bytes as `image_url` under a 2.5 MiB budget |
| Text-only (or custom slug without `imageInput`) | **proxy** — a vision model describes the image first (OCR-first, wrapped as untrusted content), then the chat model sees that text |

**Change the mode** — there is no dedicated webview for this. Run **OpenRouter: Open Settings**, search `visionMode`, pick `auto` / `native` / `proxy` / `mcp`. The value applies to every OpenRouter model in the picker.

**Configure the vision proxy** (used by `auto`/`proxy`, and as MCP fallback):

1. Run **OpenRouter: Configure Vision Proxy**.
2. Leave **Automatic** unless you need another source. Automatic tries OpenRouter `google/gemini-2.0-flash-001`, then a VS Code vision model.
3. Or choose a VS Code language model / a custom API endpoint, then **Save**. **Test** sends a sample image so you can confirm the describer works.

**MCP mode** (optional). This extension does not ship an image MCP server — enable one yourself (a tool whose schema takes a local image path), or list exact runtime tool IDs in `mcp.imageCapableTools`.

1. Confirm an image-capable MCP tool is enabled in Copilot Chat tools.
2. Set `openrouter-for-copilot.visionMode` to `mcp`.
3. Attach images. They are stored under the extension's global storage; the model gets a local-path prompt, not pixels.
4. Delete files with **OpenRouter: Clean Up Stored Images**, or set `mcp.imageCleanupMode` to `ttl-7d`.

If MCP is on but no image tool is available, the request falls back to the vision proxy when one is configured; otherwise it errors. Native failures do **not** fall back to proxy.

**Custom models** default to proxy (`imageInput: false`). Opt a vision slug into native:

```json
{
  "openrouter-for-copilot.customModels": [
    { "id": "openai/gpt-4o", "imageInput": true }
  ]
}
```

### Reasoning / thinking

Models that advertise `reasoning_effort` in the OpenRouter catalog expose effort controls in Copilot's model menu. Use `openrouter-for-copilot.stripThinkTags` if a model leaks reasoning tags into the visible reply.

### Agent Swarm (`@swarm`)

A multi-stage pipeline for larger tasks:

1. **Research** — parallel agents explore the codebase.
2. **Review** — pre-implementation review of the plan.
3. **Implement** — runs on **the model you currently have selected** in chat.

**How to run:**

1. Open a workspace folder.
2. Select the implementer model in Copilot Chat (this is the model that writes code).
3. Type `@swarm` followed by your task description. Attach `@file` references or editor selections as needed — the swarm receives them.

When `agentRoles` is unset, each run probes OpenRouter `:free` models at startup and routes research, review, and implement-fallback through the fastest responders. Pin roles in settings to override:

```json
{
  "openrouter-for-copilot.agentRoles": {
    "research": [{ "vendor": "openrouter-for-copilot", "family": "meta-llama", "id": "meta-llama/llama-3.3-70b-instruct:free" }],
    "review": [{ "vendor": "openrouter-for-copilot", "family": "google", "id": "google/gemini-2.0-flash-exp:free" }]
  }
}
```

### Ponytail & Code Simplifier

- **Ponytail** (`ponytailMode`, default `full`) — injects a lazy-senior-dev system instruction: prefer reuse, deletion over addition, minimum working code.
- **Code Simplifier** (`codeSimplifier`, default on) — after edits, auto-refines recent changes for clarity. When both are on, Ponytail drops to Lite.

Toggle via **OpenRouter: Set Ponytail Mode** and **OpenRouter: Toggle Code Simplifier**.

## Commands

| Command | Action |
| ------- | ------ |
| **OpenRouter: Set API Key** | Store your OpenRouter key |
| **OpenRouter: Clear API Key** | Remove stored key |
| **OpenRouter: Open API Key Page** | Open openrouter.ai/keys |
| **OpenRouter: Query Usage** | Open openrouter.ai/activity |
| **OpenRouter: Refresh Model List** | Re-fetch catalog from OpenRouter |
| **OpenRouter: Configure Vision Proxy** | Vision proxy source (auto / VS Code LM / custom endpoint) |
| **OpenRouter: Clean Up Stored Images** | Delete locally stored MCP vision images |
| **OpenRouter: Set Ponytail Mode** | Coding-discipline intensity |
| **OpenRouter: Toggle Code Simplifier** | Post-edit simplification on/off |
| **OpenRouter: Open Settings** | Jump to extension settings |
| **OpenRouter: Show Logs** | Output channel (metadata mode) |
| **OpenRouter: Show Runtime Diagnostics** | Runtime report |
| **OpenRouter: Open Request Dumps Folder** | Verbose request dumps |

## Settings

All keys live under **`openrouter-for-copilot.*`**. Open via **OpenRouter: Open Settings** or search `openrouter-for-copilot` in Settings.

| Setting | Default | Description |
| ------- | ------- | ----------- |
| `baseUrl` | empty | Override API base; empty → `https://openrouter.ai/api/v1` |
| `maxTokens` | `0` | Max output tokens (`0` = API default) |
| `modelIdOverrides` | utility → `deepseek/deepseek-chat` | Remap picker IDs to API slugs |
| `customModels` | `[]` | Extra slugs or objects (`id`, `thinking`, `imageInput`, …) |
| `agentRoles` | `{}` | Swarm: `research`, `review`, `implementFallback` |
| `visionModel` | empty | VS Code vision fallback (`vendor/id`) |
| `visionPrompt` | built-in OCR-first prompt | Image description prompt (proxy mode) |
| `visionMode` | `auto` | Image routing: `auto` / `native` / `proxy` / `mcp` (see [Attach images](#attach-images)) |
| `imageHandlingPrompt` | built-in | System instruction for `mcp` vision mode |
| `imageStoredPrompt` | built-in | Per-image local-path prompt (`mcp`) |
| `mcp.imageCleanupMode` | `manual` | `manual` / `ttl-7d` for stored MCP images |
| `mcp.imageCapableTools` | `[]` | Extra MCP tool IDs treated as image readers |
| `ponytailMode` | `full` | `off` / `lite` / `full` / `ultra` |
| `codeSimplifier` | `true` | Post-edit simplification |
| `stripThinkTags` | `auto` | Strip leaked reasoning tags |
| `rules` | `[]` | User rules injected on coding requests |
| `allowExtraTools` | `false` | Forward MCP tools to swarm (experimental) |
| `auditFreeModelProbeMs` | `6000` | Swarm free-model probe timeout (500–30000 ms) |
| `debugMode` | `minimal` | `minimal` / `metadata` / `verbose` |
| `experimental.stabilizeToolList` | `false` | Experimental tool-list stabilization |

Example — add a free model, enable native vision on a custom slug, and a project rule:

```json
{
  "openrouter-for-copilot.customModels": [
    "mistralai/mistral-small-3.1-24b-instruct:free",
    { "id": "openai/gpt-4o", "imageInput": true }
  ],
  "openrouter-for-copilot.visionMode": "auto",
  "openrouter-for-copilot.rules": ["Always use TypeScript rather than JavaScript"]
}
```

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

Add credits at [openrouter.ai/activity](https://openrouter.ai/activity) or pick a `:free` slug. Run **OpenRouter: Query Usage**.

### HTTP 404 — model not found

Run **OpenRouter: Refresh Model List** and pick a current slug from [openrouter.ai/models](https://openrouter.ai/models).

### Utility model BYOK error

Known VS Code regression when the main model is BYOK — [microsoft/vscode#324007](https://github.com/microsoft/vscode/issues/324007). Default `modelIdOverrides` map `copilot-utility*` to `deepseek/deepseek-chat`.

### Images ignored or described instead of sent as pixels

1. Confirm the picker model actually accepts images on [openrouter.ai/models](https://openrouter.ai/models). Custom slugs need `"imageInput": true`.
2. Check `visionMode`: `proxy` always describes; `native` sends bytes only if the model is marked image-capable (or you forced `native` for every model).
3. For proxy failures, run **OpenRouter: Configure Vision Proxy** → **Test**, or **OpenRouter: Show Logs**.

### MCP vision errors

MCP needs tool calling **and** an image-capable tool. If neither a tool nor a vision proxy is available, the request fails. Enable a local-path image tool, add its ID to `mcp.imageCapableTools`, or switch `visionMode` back to `auto`.

### Debug logging

Set `debugMode` to `metadata` and run **OpenRouter: Show Logs**. For full request payloads (contains prompt text), use `verbose` and **OpenRouter: Open Request Dumps Folder**.

## License

[MIT](LICENSE)
