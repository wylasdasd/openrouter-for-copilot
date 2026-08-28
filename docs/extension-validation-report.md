# Contributor validation checklist

> OpenRouter for Copilot v3.11.14

Internal pre-release checklist. Not user documentation.

---

## Build

```bash
pnpm install --frozen-lockfile
pnpm lint && pnpm format:check
pnpm test
pnpm compile && pnpm package
```

CI (`.github/workflows/ci.yml`) uploads `openrouter-for-copilot.vsix`.

---

## Smoke test

- [ ] **OpenRouter: Set API Key** stores key; picker warning clears
- [ ] OpenRouter models appear under vendor **OpenRouter**
- [ ] Chat completion on a cheap model (e.g. `deepseek/deepseek-chat`)
- [ ] **OpenRouter: Refresh Model List** updates picker
- [ ] **OpenRouter: Query Usage** opens openrouter.ai/activity
- [ ] Image attachment → vision proxy describes → text model responds
- [ ] `@swarm` on a small task with a `:free` model
- [ ] Agent window: `extensions.supportAgentsWindow` allowlist if models missing there

---

## Test areas

| Area | Path |
| ---- | ---- |
| Catalog | `test/provider/models.test.ts` |
| Config migration | `test/config.test.ts` |
| Endpoint / URL helpers | `test/endpoint.test.ts` |
| HTTP errors | `test/client/error.test.ts` |
| Message convert | `test/provider/convert.test.ts` |
| Swarm | `test/agents/*` |
| Commands | `test/runtime/commands.test.ts` |

Run `pnpm validate:models` to sanity-check live OpenRouter catalog mapping.

---

## Known limitations

| Item | Notes |
| ---- | ----- |
| Stream idle timeout | No SSE silence watchdog in `client/core.ts` |
| Anthropic client code | Present for custom `baseUrl`; unused on default OpenRouter path |
| `models-dev.ts` | Snapshot storage wired; not merged into catalog fetch |
| `apiKey` in settings | Supported as CI/automation fallback; not exposed in `package.json` UI |
| `GLMChatProvider` | Legacy class name |

---

## Related docs

- [Architecture](architecture-optimizations.md)
- [Migration](porting-roadmap.md)
- [Swarm](swarm-validation-report.md)
- [README](../README.md)
