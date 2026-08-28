# Changelog

All notable changes to **OpenRouter for Copilot** are documented here.

## [3.11.18](https://github.com/abbalochdev/openrouter-for-copilot/compare/v3.11.17...v3.11.18) (2026-08-28)

### Fixes

* **Picker** — Copilot Chat Other Models uses `detail` as the row label. Stop putting OpenRouter description paragraphs there; the row now shows `op: …` and the blurb stays on the hover tooltip.

## [3.11.17](https://github.com/abbalochdev/openrouter-for-copilot/compare/v3.11.16...v3.11.17) (2026-08-28)

### Fixes

* **Picker** — register as vendor `openrouter-for-copilot` instead of `openrouter`. Copilot Chat's built-in BYOK already owns `openrouter`, so this extension never appeared under Other Models unless a sibling like OpenCode (vendor `opencode`) created that section.

## [3.11.16](https://github.com/abbalochdev/openrouter-for-copilot/compare/v3.11.15...v3.11.16) (2026-08-28)

### Fixes

* **Picker** — on cold start, activate Copilot Chat then force-pull `openrouter` models (with delayed retries). Restart no longer leaves Other models empty until disable/enable.

## [3.11.15](https://github.com/abbalochdev/openrouter-for-copilot/compare/v3.11.14...v3.11.15) (2026-08-28)

### Fixes

* **Picker** — prefix OpenRouter model display names with `op: ` so they stay distinct when OpenCode/GLM sibling extensions are enabled alongside this one.
* **Restart** — stop reporting an empty catalog on extension deactivate; Copilot Chat was persisting that state across restarts and wiping Other models until reinstall.

## [3.11.14](https://github.com/abbalochdev/openrouter-for-copilot/compare/v3.11.13...v3.11.14) (2026-08-28)

### OpenRouter migration

* **Rebrand** — extension `openrouter-for-copilot`, vendor `openrouter`, settings `openrouter-for-copilot.*`, commands **OpenRouter:***, output channel **OpenRouter**.
* **Catalog** — `src/provider/openrouter-models.ts` fetches `GET /api/v1/models`; picker IDs are OpenRouter slugs. Removed `opencode-models.ts`.
* **API** — default `https://openrouter.ai/api/v1` + OpenAI-compatible `/chat/completions`. Removed `endpoint` / `opencodePlan` settings.
* **Auth** — single SecretStorage key `openrouter-for-copilot.apiKey`; **Query Usage** → openrouter.ai/activity. Migrates `opencode-for-copilot.*` settings and legacy GLM/OpenCode secrets once.
* **Vision** — automatic mode uses `google/gemini-2.0-flash-001` on OpenRouter, then VS Code vision fallback.
* **Swarm** — participant `openrouter-for-copilot.pipeline`; free-tier audit probes OpenRouter `:free` slugs in `FREE_MODEL_REFS`.
* **Errors** — OpenRouter 401/402/404 messages; legacy `opencode.ai` baseUrl still maps Zen-only billing errors.
* **Docs** — README, walkthrough, contributor docs rewritten; removed obsolete internal review and unimplemented team-mode plan.

---

## Prior history

Versions **3.11.13 and earlier** shipped as [**OpenCode for Copilot**](https://github.com/abbalochdev/opencode-for-copilot). See that repository's `CHANGELOG.md` for GLM → OpenCode → swarm/Ponytail history.
