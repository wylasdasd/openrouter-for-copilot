# Agent Swarm

> `@swarm` in Copilot Chat · participant `openrouter-for-copilot.pipeline`

---

## Pipeline

```
User prompt (+ @-references, editor selection)
  → auditFreeModels (parallel probe of FREE_MODEL_REFS)
  → runPipeline
       ├─ runResearch      — decompose ≤3 areas, parallel read-only agents
       ├─ runPreImplementationReview — parallel read-only reviewers
       └─ runImplementation — chat-selected model, full tools, runTests loop
  → formatReport → markdown response
```

---

## Model selection

| Role | Source |
| ---- | ------ |
| **implement** | Always the model you picked in Copilot Chat |
| **research / review / implementFallback** | `agentRoles` setting, **or** audited `:free` list when unset |

### Free-tier probe list (`FREE_MODEL_REFS`)

- `meta-llama/llama-3.3-70b-instruct:free`
- `google/gemini-2.0-flash-exp:free`
- `deepseek/deepseek-r1-distill-llama-70b:free`
- `qwen/qwen-2.5-coder-32b-instruct:free`

Probe timeout: `openrouter-for-copilot.auditFreeModelProbeMs` (default **6000** ms, range 500–30000). Skipped when any `agentRoles.*` list is pinned.

When audit returns no alive models, hard fallback: `meta-llama/llama-3.3-70b-instruct:free`.

### Pin roles

```json
{
  "openrouter-for-copilot.agentRoles": {
    "research": [
      { "vendor": "openrouter", "family": "meta-llama", "id": "meta-llama/llama-3.3-70b-instruct:free" }
    ],
    "review": [
      { "vendor": "openrouter", "family": "google", "id": "google/gemini-2.0-flash-exp:free" }
    ],
    "implementFallback": [
      { "vendor": "openrouter", "family": "deepseek", "id": "deepseek/deepseek-chat" }
    ]
  }
}
```

`vendor` must be `openrouter` for OpenRouter models.

---

## Tools

- **Research / review:** curated read-only built-in tools.
- **Implement:** full curated set including `apply_patch`, `runTests`, etc.
- **`allowExtraTools: true`** (experimental): also forward MCP / Copilot-registered tools (128 cap).

---

## Resilience

| Feature | Module |
| ------- | ------ |
| Retry (429 / 5xx / network) | `agents/retry.ts` |
| Model failover | `agents/loop.ts`, `agents/implement.ts` |
| Failed area → degraded note | `agents/research.ts` |
| Spin guard | `agents/loop.ts` |
| 6 KB tool-result truncation | `agents/loop.ts` |

---

## Tests

```bash
pnpm test test/agents
```

Key files: `test/agents/research.test.ts`, `review.test.ts`, `implement.test.ts`, `retry.test.ts`, `audit-free-models.test.ts`, `tools-allow-extra.test.ts`.
