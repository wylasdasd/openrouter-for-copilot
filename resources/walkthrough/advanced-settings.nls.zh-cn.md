# 高级设置

运行 **OpenRouter: 打开设置**，或搜索 `openrouter-for-copilot`。

| 设置项 | 用途 |
| ------ | ---- |
| `customModels` | 添加 OpenRouter slug |
| `modelIdOverrides` | 映射 picker ID |
| `agentRoles` | 固定 `@swarm` 各角色模型 |
| `visionMode` | `auto` / `native` / `proxy` / `mcp` 图片路由（设置 UI；详见 README） |
| `visionModel` | 视觉代理 VS Code 回退 |
| `mcp.imageCleanupMode` | 已存 MCP 图片：`manual` 或 `ttl-7d` |
| `ponytailMode` | Ponytail 强度 |
| `debugMode` | 日志级别 |

## Agent 窗口白名单

若编辑器聊天中可见、agent 窗口中不可见：

```json
{
  "extensions.supportAgentsWindow": {
    "wylasdasd.openrouter-for-copilot": true
  }
}
```

完整设置、图片使用说明与排错见 [README.zh-cn.md](../../README.zh-cn.md#发送图片)。
