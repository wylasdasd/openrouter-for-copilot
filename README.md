<h1 align="center">OpenRouter for Copilot Chat</h1>

<p align="center">
  <!-- marketplace-readme:remove-start -->
  <img src="https://img.shields.io/badge/OpenRouter-BYOK-007ACC?logo=visualstudiocode&logoColor=white&style=for-the-badge" alt="OpenRouter BYOK" />
  <br/>
  <img src="https://img.shields.io/github/v/release/wylasdasd/openrouter-for-copilot?style=for-the-badge&label=Version" alt="Version" />
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

**Marketplace / Open VSX:** search for `wylasdasd.openrouter-for-copilot`, or install from the [Releases](https://github.com/wylasdasd/openrouter-for-copilot/releases) page.

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

Two places to configure vision (they do different jobs):

| Where | Command / key | What it controls |
| ----- | ------------- | ---------------- |
| Settings UI | `openrouter-for-copilot.visionMode` | How images reach the **chat** model (`auto` / `native` / `proxy` / `mcp`) |
| Dedicated panel | **OpenRouter: Configure Vision Proxy** | Which model **describes** the image when proxy is used |
| `settings.json` | `visionPrompt`, `imageHandlingPrompt`, `imageStoredPrompt` | The actual prompt text (not shown on the proxy panel) |

#### `visionMode` — image routing

Applies to every OpenRouter model in the picker. **OpenRouter: Open Settings**, search `visionMode`.

| Value | When to use | What happens |
| ----- | ----------- | ------------ |
| `auto` (default) | Leave this unless you have a reason | Catalog says the chat model accepts images → **native**. Text-only (or custom slug without `imageInput`) → **proxy**. |
| `native` | Force pixels to every selected model | Resize (VS Code `_chat.resizeImage`) and send bytes as `image_url` under a 2.5 MiB budget. If the model cannot see images, this fails — it does **not** fall back to proxy. |
| `proxy` | Chat model is text-only, or you always want a text description | A vision model describes the image (OCR-first, wrapped as untrusted content). The chat model only sees that text. |
| `mcp` | You have an MCP tool that reads a **local file path** | Images are saved under the extension's global storage. The chat model gets a path prompt, not pixels. |

#### Vision Proxy panel — describer model

Used by `auto`/`proxy`, and as fallback when `mcp` has no image tool. Command Palette → **OpenRouter: Configure Vision Proxy**. This panel does **not** contain the prompt.

| Source | What it does |
| ------ | ------------ |
| **Automatic** | Try OpenRouter `google/gemini-2.0-flash-001`, then a VS Code vision model. |
| **VS Code model** | Pick a vision-capable model already registered in VS Code. Stored as `openrouter-for-copilot.visionModel` (`vendor/id`). That key is tagged `advanced`, so the Settings UI hides it unless you search `visionModel` or enable **Show advanced settings**. Prefer this panel over editing the string by hand. |
| **API endpoint** | Your own OpenAI Chat Completions / Responses or Anthropic Messages URL. |

API endpoint fields:

| Field | Meaning |
| ----- | ------- |
| Endpoint URL | Full chat/completions, `/responses`, or `/messages` URL |
| Endpoint type | Auto-detected from the URL when possible; otherwise pick Chat Completions / Responses / Messages |
| API key | Stored in VS Code SecretStorage, not `settings.json` |
| Model ID | Model slug the endpoint expects (e.g. `gpt-4o-mini`) |
| Custom headers JSON | Extra HTTP headers, e.g. `{"X-Custom-Header": "value"}` |
| Additional request body JSON | Merged into the body (`temperature`, `max_tokens`, …). **Not** the vision prompt. Cannot override `model`, `messages`, `input`, or `stream`. |

Use **Test** (sends a sample image) then **Save**.

#### Prompt settings — not on the panel

Defaults are built in. Override in **Preferences: Open User Settings (JSON)**. The Settings UI shows a one-line box; use **Edit in settings.json** for the full text. Empty / whitespace `visionPrompt` falls back to the built-in OCR-first default.

| Setting | Used when | Role |
| ------- | --------- | ---- |
| `openrouter-for-copilot.visionPrompt` | `auto` / `proxy` (and MCP → proxy fallback) | Instruction sent **to the vision describer** (extract text, then visual context). |
| `openrouter-for-copilot.imageHandlingPrompt` | `mcp` | System instruction on **every** MCP-mode turn (including text-only) so the prompt-cache prefix stays stable. |
| `openrouter-for-copilot.imageStoredPrompt` | `mcp` | Per-image line after a file is stored. `{0}` = label, `{1}` = file path. |

```json
{
  "openrouter-for-copilot.visionMode": "auto",
  "openrouter-for-copilot.visionPrompt": "Extract visible text first, then describe the visual context. …",
  "openrouter-for-copilot.imageHandlingPrompt": "[Image Handling]\n…",
  "openrouter-for-copilot.imageStoredPrompt": "[{0} attached at local file: {1}]\n…"
}
```

#### MCP mode extras

This extension does not ship an image MCP server. Enable a tool whose schema takes a local image path, or list exact runtime IDs.

1. Enable the image MCP tool in Copilot Chat tools.
2. Set `visionMode` to `mcp`.
3. Attach images. The model sees a local-path prompt, not pixels.
4. Delete files with **OpenRouter: Clean Up Stored Images**, or set `mcp.imageCleanupMode` to `ttl-7d`.

| Setting | Default | Role |
| ------- | ------- | ---- |
| `mcp.imageCapableTools` | `[]` | Extra Copilot runtime tool IDs treated as image readers. Official tools are also auto-detected from a required local-path input. |
| `mcp.imageCleanupMode` | `manual` | `manual`: keep until you run Clean Up. `ttl-7d`: delete files last referenced more than 7 days ago (on activation). |

If MCP is on but no image tool is available, the request falls back to the vision proxy when one is configured; otherwise it errors.

#### Custom models and native vision

Custom slugs default to proxy (`imageInput: false`). Opt a vision slug into native:

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
| **OpenRouter: Configure Vision Proxy** | Describer model source (auto / VS Code LM / custom endpoint). Prompts are separate settings — see [Attach images](#attach-images) |
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
| `customModels` | `[]` | Extra slugs or objects (`id`, `thinking`, `imageInput`, …). `imageInput: true` opts a slug into native |
| `agentRoles` | `{}` | Swarm: `research`, `review`, `implementFallback` |
| `visionMode` | `auto` | Image routing: `auto` / `native` / `proxy` / `mcp` — [Attach images](#attach-images) |
| `visionModel` | empty | VS Code vision fallback (`vendor/id`). Hidden as advanced; set via **Configure Vision Proxy** |
| `visionPrompt` | built-in OCR-first prompt | Instruction to the **describer** in proxy mode. Edit in `settings.json`, not the proxy panel |
| `imageHandlingPrompt` | built-in | MCP system instruction (every MCP-mode turn). Edit in `settings.json` |
| `imageStoredPrompt` | built-in | MCP per-image path line (`{0}` label, `{1}` path). Edit in `settings.json` |
| `mcp.imageCleanupMode` | `manual` | Stored MCP images: `manual` or `ttl-7d` |
| `mcp.imageCapableTools` | `[]` | Extra Copilot runtime IDs treated as image readers |
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
    "wylasdasd.openrouter-for-copilot": true
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

## Code structure

Layout of `src/` (runtime, provider, client, agents, vision) and the Copilot → OpenRouter request path: [docs/code-structure.md](docs/code-structure.md). Retries, catalog cache, and vision internals: [docs/architecture-optimizations.md](docs/architecture-optimizations.md).

## License

[MIT](LICENSE)
