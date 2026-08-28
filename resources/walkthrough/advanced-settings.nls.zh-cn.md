# 高级设置

运行 **OpenRouter: 打开设置**，或搜索 `openrouter-for-copilot`。

| 设置项 | 用途 |
| ------ | ---- |
| `customModels` | 添加 OpenRouter slug |
| `modelIdOverrides` | 映射 picker ID |
| `agentRoles` | 固定 `@swarm` 各角色模型 |
| `visionModel` | 视觉代理 VS Code 回退 |
| `ponytailMode` | Ponytail 强度 |
| `debugMode` | 日志级别 |

## Agent 窗口白名单

若编辑器聊天中可见、agent 窗口中不可见：

```json
{
  "extensions.supportAgentsWindow": {
    "abbalochdev.openrouter-for-copilot": true
  }
}
```

完整设置与排错见 [README.zh-cn.md](../../README.zh-cn.md)。
