# 代码框架与结构

本扩展是 **Copilot Chat 的语言模型供应商**，不是独立聊天界面。Copilot 通过 `vscode.lm.registerLanguageModelChatProvider('openrouter-for-copilot', …)` 调用。对话走 OpenRouter `POST /api/v1/chat/completions`，目录来自 `GET /api/v1/models`。

运行时细节（重试、目录缓存、视觉模式）：[architecture-optimizations.md](architecture-optimizations.md)。用户向视觉配置：README [发送图片](../README.zh-cn.md#发送图片)。

构建：`vite-plus` 把 `src/extension.ts` 打成 `out/extension.js`（`package.json` 的 `"main"`）。运行时无 npm 依赖；`vscode` 不打进包。

## 顶层目录

```
src/
  extension.ts          导出 activate / deactivate
  runtime/              生命周期、命令、注册供应商
  provider/             LanguageModelChatProvider，以及请求 / 流 / 视觉 / 工具
  client/               HTTP 流（默认 OpenAI；自定义 baseUrl 才用 Anthropic / Responses）
  agents/               @swarm：研究 → 评审 → 实现
  config.ts             读 openrouter-for-copilot.*，一次性迁移旧设置
  auth.ts               SecretStorage 里的 API Key
  consts.ts             vendor、密钥名、walkthrough id
  endpoint.ts           默认 OpenRouter URL
  i18n.ts               界面文案（中/英）
test/                   Vitest；vscode 由 test/support/vscode.mock.ts 模拟
scripts/                安装 vsix、校验目录
resources/              图标、入门 walkthrough
```

供应商类仍叫 `GLMChatProvider`（`src/provider/index.ts`），是 GLM / OpenCode 分叉留下的名字，行为已是 OpenRouter。

## 启动顺序

`src/runtime/lifecycle.ts`：

1. `migrateLegacySettings` / `migrateLegacySecrets`
2. 诊断、Copilot 语言模型默认值、MCP 图片存储
3. `registerCommands`（日志、设置、dump 目录、清理图片）
4. `registerAgentPipeline`（`@swarm` 聊天参与者）
5. `registerProvider` → `new GLMChatProvider` → `registerLanguageModelChatProvider`

需要供应商实例的命令（API Key、刷新模型、视觉代理面板）在 `runtime/provider.ts`，不在 `runtime/commands.ts`。

## 聊天请求路径

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

| 路径 | 职责 |
| ---- | ---- |
| `provider/openrouter-models.ts` | 拉取/缓存目录：slug、上下文、定价、`imageInput` |
| `provider/models.ts` | 目录 → 选择器行（`op: …`） |
| `provider/request.ts` | OpenAI 请求体：Ponytail、rules、tools、max tokens |
| `provider/stream.ts` | 把流式 chunk 交回 Copilot |
| `provider/tokens.ts` | 选择器用的 token 估算 |
| `provider/ponytail.ts` / `rules.ts` / `think-filter.ts` / `code-simplifier.ts` | 系统指令类附加 |
| `provider/pricing/` | 状态栏费用估算 |
| `provider/debug/` | `debugMode` 日志和 verbose dump |
| `provider/replay/` | 工具/视觉回合的 replay 标记 |

## 视觉（`src/provider/vision/`）

`createVisionService`（`service.ts`）+ `resolveImageMessages`（`resolve.ts`）选定模式后：

| 模式 | 代码 |
| ---- | ---- |
| native | `native.ts` — 缩放后发 `image_url` 字节 |
| proxy | `sources/vscode/`、`sources/endpoint/` — 先描述，再把文字给聊天模型 |
| mcp | `image-store.ts`、`image-capable-tools.ts` — 本地文件 + 路径提示 |

自定义视觉端点协议：`protocols/providers/openai/`、`anthropic/`。面板：`ui/panel.ts`。Prompt **不在面板里** — `visionPrompt` / MCP 提示走设置（`sources/vscode/index.ts` 的 `getVisionPrompt()`、`image-store.ts`）。

## Swarm（`src/agents/` + `runtime/agent-pipeline.ts`）

参与者 id：`openrouter-for-copilot.pipeline`。

`pipeline.ts`：研究（`research.ts`）→ 评审（`review.ts`）→ 在**当前选中的聊天模型**上实现（`implement.ts`）。共用工具循环：`loop.ts`。未设置 `agentRoles` 时的免费模型探测：`audit-free-models.ts`。

## HTTP（`src/client/`）

默认协议是 OpenAI（`getApiProtocol()` → `'openai'`）。`core.ts` 负责 fetch、SSE、重试、工具减半、上下文溢出重试。`anthropic/` 和 `responses/` 只给自定义 `baseUrl` 用。

## 测试

`test/**/*.test.ts` 与 `src/` 大致对应（如 `test/provider/vision/`）。`vite.config.mts` 把 `vscode` 指到 `test/support/vscode.mock.ts`。
