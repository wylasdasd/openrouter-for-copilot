# Advanced settings

Open extension settings: **OpenRouter: Open Settings**, or search `openrouter-for-copilot`.

| Setting | Purpose |
| ------- | ------- |
| `customModels` | Add OpenRouter slugs to the picker |
| `modelIdOverrides` | Remap picker IDs to different API slugs |
| `agentRoles` | Pin `@swarm` research / review / implementFallback models |
| `visionMode` | `auto` / `native` / `proxy` / `mcp` image routing (Settings UI; see README) |
| `visionModel` | VS Code vision fallback for the image proxy |
| `mcp.imageCleanupMode` | Stored MCP images: `manual` or `ttl-7d` |
| `ponytailMode` | Lazy-senior-dev instruction intensity |
| `debugMode` | `minimal` / `metadata` / `verbose` logging |

## Agent window allowlist

If models appear in editor chat but not in the agent / background agent window:

```json
{
  "extensions.supportAgentsWindow": {
    "abbalochdev.openrouter-for-copilot": true
  }
}
```

See [README.md](../../README.md#attach-images) for vision usage (native / proxy / mcp) and troubleshooting.
