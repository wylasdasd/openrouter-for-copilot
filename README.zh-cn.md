<h1 align="center">OpenRouter for Copilot Chat</h1>

<p align="center">
  <img src="https://img.shields.io/badge/OpenRouter-BYOK-007ACC?logo=visualstudiocode&logoColor=white&style=for-the-badge" alt="OpenRouter BYOK" />
  <br/>
  <img src="https://img.shields.io/github/v/release/wylasdasd/openrouter-for-copilot?style=for-the-badge&label=版本" alt="版本" />
</p>

<p align="center">
  <a href="README.md">English</a> |
  简体中文
</p>

在 GitHub Copilot Chat 模型选择器中使用 **OpenRouter 400+ 模型** — BYOK、Agent 模式、视觉（native / proxy / mcp）、推理控制与 `@swarm` 多 Agent 流水线。不新增聊天界面，全部在 Copilot Chat 内完成。

## 环境要求

| 项目 | 版本 |
| ---- | ---- |
| VS Code | 1.116+ |
| GitHub Copilot | 有效订阅 |
| OpenRouter | 账户 + API Key |

## 安装

**Marketplace / Open VSX：** 搜索 `wylasdasd.openrouter-for-copilot`，或从 [Releases](https://github.com/wylasdasd/openrouter-for-copilot/releases) 页面安装。

**从源码：**

```bash
pnpm install
pnpm compile
```

按 **F5** 启动 Extension Development Host，或运行 `pnpm package` 打包 `.vsix`。

## 快速开始

1. 在 [openrouter.ai/keys](https://openrouter.ai/keys) 创建 API Key。
2. 打开命令面板，运行 **OpenRouter: 设置 API Key**。Key 存入 VS Code SecretStorage（系统密钥链），不会写入 `settings.json`。
3. 打开 Copilot Chat，点击模型选择器，在供应商 **OpenRouter** 下选择模型（ID 形如 `op: deepseek/deepseek-chat`）。
4. 正常聊天即可 — Agent 模式、工具、MCP、Instructions、Skills 均走你的 OpenRouter 账户。

若模型未出现：

1. 确认 API Key 已设置。
2. 运行 **OpenRouter: 刷新模型列表**。
3. 打开 **Chat: Manage Language Models**（`workbench.action.chat.manage`），确认 OpenRouter 模型已启用。

## 功能概览

扩展在 Copilot Chat 内注册供应商 **`openrouter-for-copilot`**（显示名 OpenRouter），不新增侧边栏或独立聊天窗口。主要功能如下：

### 模型与接入

| 功能 | 说明 |
| ---- | ---- |
| **OpenRouter BYOK** | 自带 OpenRouter API Key，按 OpenRouter 定价计费，不走 Copilot 模型配额 |
| **400+ 模型目录** | 启动时从 OpenRouter 拉取 `GET /api/v1/models`，模型选择器实时展示 |
| **Copilot Chat 原生集成** | 在现有模型选择器、Agent 模式、工具面板中直接使用，无需切换界面 |
| **自定义模型** | `customModels` 添加 slug 或完整模型对象（名称、token 上限、tool calling、`imageInput` 等） |
| **模型 ID 映射** | `modelIdOverrides` 将选择器 ID 映射到不同 API slug（含 Copilot utility 别名） |
| **端点覆盖** | `baseUrl` 可指向兼容 OpenAI Chat Completions 的代理或私有网关 |

### Copilot 能力保留

| 功能 | 说明 |
| ---- | ---- |
| **Agent 模式** | 读文件、改代码、跑终端、apply patch 等 Copilot Agent 工具 |
| **MCP 工具** | 你在 VS Code 中配置的 MCP Server 随聊天请求转发 |
| **Instructions / Skills** | Copilot 用户指令与 Skills 照常生效 |
| **Utility 模型** | 标题生成、commit message 等后台小任务默认走 `deepseek/deepseek-chat` |

### 多模态与推理

| 功能 | 说明 |
| ---- | ---- |
| **视觉：native / proxy / mcp** | 支持图片的模型直接收缩放后的字节（2.5 MiB 预算）。纯文本模型走视觉代理（OpenRouter Gemini Flash → VS Code 回退）。可选 `mcp` 把文件存盘交给识图 MCP 工具。 |
| **推理强度控制** | 目录中支持 `reasoning_effort` 的模型可在 Copilot 菜单调节思考深度 |
| **思考标签过滤** | `stripThinkTags` 剥离泄漏到正文中的推理标签（如 MiniMax 等模型的 think 块） |

### Agent Swarm（`@swarm`）

| 功能 | 说明 |
| ---- | ---- |
| **三阶段流水线** | 并行 Research → Review → 在你选定的聊天模型上 Implement |
| **上下文传递** | 接收 `@file` 引用、URL、符号范围与编辑器选区 |
| **免费模型探测** | 未固定 `agentRoles` 时，每次运行探测 `:free` 模型并按延迟分配角色 |
| **实现回退** | 主模型 429/5xx 时自动尝试 `implementFallback` 列表 |
| **MCP 扩展（实验性）** | `allowExtraTools` 将 MCP 工具转发给 Swarm Agent |

### 编码辅助

| 功能 | 说明 |
| ---- | ---- |
| **Ponytail 模式** | 注入「懒人高级开发者」系统指令（`off` / `lite` / `full` / `ultra`） |
| **代码精简器** | 编辑完成后自动精简近期改动，提升可读性与一致性 |
| **用户规则** | `rules` 数组注入 `### USER RULES` 块，强制项目约定（仅编码请求） |

### 费用与调试

| 功能 | 说明 |
| ---- | ---- |
| **Token 用量上报** | API 返回用量时自动上报给 Copilot |
| **费用估算** | 状态栏显示当日 / 当月 OpenRouter 估算费用 |
| **三级调试** | `debugMode`：`minimal`（仅用量）/ `metadata`（隐私安全日志）/ `verbose`（完整请求 dump） |
| **运行时诊断** | **OpenRouter: 显示运行时诊断** 生成扩展状态报告 |

## 日常使用

### 选择模型

模型选择器中的 ID 是 OpenRouter slug（`provider/model`），前缀 `op:` 用于与 Copilot 内置 BYOK 区分。完整目录见 [openrouter.ai/models](https://openrouter.ai/models)。

| Slug | 适用场景 |
| ---- | -------- |
| `deepseek/deepseek-chat` | 快速、经济（utility 别名默认目标） |
| `anthropic/claude-3.5-sonnet` | 通用编码 |
| `google/gemini-2.0-flash-001` | 多模态；默认视觉代理 |
| `openai/gpt-4o-mini` | 轻量通用 |
| `meta-llama/llama-3.3-70b-instruct:free` | 免费层（`:free` 后缀） |

通过 `openrouter-for-copilot.customModels` 添加自定义 slug，修改后选择器自动刷新，无需重启。

### Agent 模式

选择支持 tool calling 的 OpenRouter 模型，将 Copilot Chat 切换到 **Agent**，用法与原生 Copilot 模型一致。请求发往 `https://openrouter.ai/api/v1/chat/completions`（OpenAI 兼容）。

### 发送图片

图片路由对齐 [GLM for Copilot](https://github.com/umbrella22/GLM-for-copilot)。在 Copilot Chat 里附加截图或照片（回形针 / 拖放）后发送即可，没有单独的侧边栏。

视觉相关配置分三处，职责不同：

| 入口 | 命令 / 键 | 控制什么 |
| ---- | --------- | -------- |
| 设置 UI | `openrouter-for-copilot.visionMode` | 图片如何到达**聊天模型**（`auto` / `native` / `proxy` / `mcp`） |
| 独立面板 | **OpenRouter: 配置视觉代理** | **proxy** 时用哪台模型去**描述**图片 |
| `settings.json` | `visionPrompt`、`imageHandlingPrompt`、`imageStoredPrompt` | 实际 prompt 文本（视觉代理面板里没有这项） |

选择器里每台模型都会向 Copilot 声明 `imageInput: true`（与 [GLM for Copilot](https://github.com/umbrella22/GLM-for-copilot) 相同），这样附件才会交给扩展。目录里的纯文本模型仍然走 **proxy**，不会直接收像素。

#### `visionMode` — 图片路由

对选择器里所有 OpenRouter 模型生效。运行 **OpenRouter: 打开设置**，搜索 `visionMode`。

| 取值 | 何时用 | 实际行为 |
| ---- | ------ | -------- |
| `auto`（默认） | 一般不用改 | 目录标明聊天模型支持图片 → **native**。纯文本（或未设 `imageInput` 的自定义 slug）→ **proxy**。 |
| `native` | 强制把像素发给当前聊天模型 | 缩放（VS Code `_chat.resizeImage`）后按 `image_url` 发送字节，总预算 2.5 MiB。模型不识图就会失败，**不会**回退到 proxy。 |
| `proxy` | 聊天模型是纯文本，或你希望始终先转成文字 | 先由视觉模型描述图片（OCR 优先，包成 untrusted content），聊天模型只看到这段文字。 |
| `mcp` | 你有能读**本地文件路径**的 MCP 识图工具 | 图片存到扩展全局存储；聊天模型收到的是路径提示，不是像素。 |

#### 视觉代理面板 — 描述用哪台模型

`auto`/`proxy` 会用到；`mcp` 没有识图工具时也会回退到它。命令面板 → **OpenRouter: 配置视觉代理**。这个面板**没有** prompt 输入框。

| 来源 | 作用 |
| ---- | ---- |
| **自动** | 先试 OpenRouter `google/gemini-2.0-flash-001`，失败再回退 VS Code 视觉模型。 |
| **VS Code 模型** | 选择 VS Code 里已注册的识图模型。写入 `openrouter-for-copilot.visionModel`（`vendor/id`）。该键带 `advanced` 标签，设置页默认隐藏，需搜索 `visionModel` 或打开 **显示高级设置**。不要手改这串，用面板选。 |
| **API 端点** | 自建 OpenAI Chat Completions / Responses 或 Anthropic Messages 地址。 |

API 端点各字段：

| 字段 | 含义 |
| ---- | ---- |
| 端点 URL | 完整的 chat/completions、`/responses` 或 `/messages` 地址 |
| 端点类型 | 能从 URL 推断时会自动填；否则手动选 Chat Completions / Responses / Messages |
| API Key | 存在 VS Code SecretStorage，不写进 `settings.json` |
| 模型 ID | 端点要求的 slug（如 `gpt-4o-mini`） |
| 自定义 headers JSON | 额外 HTTP 头，例如 `{"X-Custom-Header": "value"}` |
| 额外请求体 JSON | 合并进请求体（`temperature`、`max_tokens` 等）。**不是**识图 prompt。不能覆盖 `model`、`messages`、`input`、`stream`。 |

先点 **测试**（会发一张样例图），再 **保存**。

#### Prompt 设置 — 不在面板里

默认值内置。在 **首选项: 打开用户设置 (JSON)** 里覆盖。设置 UI 只显示单行，完整内容请点 **在 settings.json 中编辑**。`visionPrompt` 为空或只含空白时，回退到内置 OCR 优先默认值。

| 设置项 | 何时生效 | 作用 |
| ------ | -------- | ---- |
| `openrouter-for-copilot.visionPrompt` | `auto` / `proxy`（以及 MCP 回退到 proxy 时） | 发给**视觉描述模型**的指令（先抽文字，再写视觉上下文）。 |
| `openrouter-for-copilot.imageHandlingPrompt` | `mcp` | 每个 MCP 回合（含纯文本回合）都会注入的系统指令，用来稳住 prompt cache 前缀。 |
| `openrouter-for-copilot.imageStoredPrompt` | `mcp` | 图片存盘后插入的那一行。`{0}` = 标签，`{1}` = 文件路径。 |

```json
{
  "openrouter-for-copilot.visionMode": "auto",
  "openrouter-for-copilot.visionPrompt": "Extract visible text first, then describe the visual context. …",
  "openrouter-for-copilot.imageHandlingPrompt": "[Image Handling]\n…",
  "openrouter-for-copilot.imageStoredPrompt": "[{0} attached at local file: {1}]\n…"
}
```

#### MCP 模式的其余配置

本扩展不内置识图 MCP。需要你自己启用「入参含本地图片路径」的工具，或填写精确运行时 ID。

1. 在 Copilot Chat 工具列表里启用识图 MCP 工具。
2. 将 `visionMode` 设为 `mcp`。
3. 附加图片。模型看到的是本地路径提示，不是像素。
4. 用 **OpenRouter: 清理已存储的图片** 删除，或把 `mcp.imageCleanupMode` 设为 `ttl-7d`。

| 设置项 | 默认值 | 作用 |
| ------ | ------ | ---- |
| `mcp.imageCapableTools` | `[]` | 额外视为识图工具的 Copilot 运行时 ID。带必填本地路径入参的官方工具也会被自动识别。 |
| `mcp.imageCleanupMode` | `manual` | `manual`：一直保留直到你手动清理。`ttl-7d`：激活时删除「上次引用」超过 7 天的文件。 |

MCP 已开但没有识图工具时：若已配置视觉代理则回退 proxy，否则报错。

#### 自定义模型与 native 识图

自定义 slug 默认走 proxy（`imageInput: false`）。识图 slug 需要显式打开 native：

```json
{
  "openrouter-for-copilot.customModels": [
    { "id": "openai/gpt-4o", "imageInput": true }
  ]
}
```

### 推理 / 思考

OpenRouter 目录中支持 `reasoning_effort` 的模型，可在 Copilot 模型菜单中调节推理强度。若模型将推理标签泄漏到可见回复，调整 `openrouter-for-copilot.stripThinkTags`。

### Agent Swarm（`@swarm`）

面向较大任务的多阶段流水线：

1. **Research** — 并行 Agent 探索代码库。
2. **Review** — 实现前评审方案。
3. **Implement** — 在**你当前在聊天中选择的模型**上执行实现。

**使用步骤：**

1. 打开工作区文件夹。
2. 在 Copilot Chat 中选择实现阶段使用的模型（负责写代码的模型）。
3. 输入 `@swarm` 加任务描述。可附加 `@file` 引用或编辑器选区 — Swarm 会接收这些内容。

未设置 `agentRoles` 时，每次运行启动前会探测 OpenRouter `:free` 模型，按延迟排序用于研究、评审与实现回退。可在设置中固定各角色模型：

```json
{
  "openrouter-for-copilot.agentRoles": {
    "research": [{ "vendor": "openrouter-for-copilot", "family": "meta-llama", "id": "meta-llama/llama-3.3-70b-instruct:free" }],
    "review": [{ "vendor": "openrouter-for-copilot", "family": "google", "id": "google/gemini-2.0-flash-exp:free" }]
  }
}
```

### Ponytail 与代码精简器

- **Ponytail**（`ponytailMode`，默认 `full`）— 注入「懒人高级开发者」系统指令：优先复用、删多于加、最少可用代码。
- **代码精简器**（`codeSimplifier`，默认开启）— 编辑后自动精简近期改动。两者同时开启时 Ponytail 降为 Lite。

通过 **OpenRouter: 设置 Ponytail 模式** 与 **OpenRouter: 切换代码精简器** 切换。

## 命令

| 命令 | 作用 |
| ---- | ---- |
| **OpenRouter: 设置 API Key** | 保存 Key |
| **OpenRouter: 清除 API Key** | 删除 Key |
| **OpenRouter: 打开 API Key 页面** | 打开 openrouter.ai/keys |
| **OpenRouter: 查询用量** | 打开 openrouter.ai/activity |
| **OpenRouter: 刷新模型列表** | 重新拉取目录 |
| **OpenRouter: 配置视觉代理** | 描述模型来源（自动 / VS Code LM / 自定义端点）。Prompt 是独立设置，见[发送图片](#发送图片) |
| **OpenRouter: 清理已存储的图片** | 删除本地 MCP 视觉图片 |
| **OpenRouter: 设置 Ponytail 模式** | 编码纪律强度 |
| **OpenRouter: 切换代码精简器** | 开关 post-edit 精简 |
| **OpenRouter: 打开设置** | 跳转扩展设置 |
| **OpenRouter: 显示日志** | 输出通道 |
| **OpenRouter: 显示运行时诊断** | 运行时报告 |
| **OpenRouter: 打开请求 Dump 目录** | verbose 模式请求转储 |

## 设置项

所有键位于 **`openrouter-for-copilot.*`**。通过 **OpenRouter: 打开设置** 或在设置中搜索 `openrouter-for-copilot`。

| 设置项 | 默认值 | 说明 |
| ------ | ------ | ---- |
| `baseUrl` | 留空 | 留空 → `https://openrouter.ai/api/v1` |
| `maxTokens` | `0` | 最大输出 token（`0` = API 默认） |
| `modelIdOverrides` | utility → `deepseek/deepseek-chat` | 映射 picker ID 到 API slug |
| `customModels` | `[]` | 额外 slug 或对象（`id`、`thinking`、`imageInput` 等）。`imageInput: true` 才走 native |
| `agentRoles` | `{}` | Swarm：`research`、`review`、`implementFallback` |
| `visionMode` | `auto` | 图片路由：`auto` / `native` / `proxy` / `mcp` — [发送图片](#发送图片) |
| `visionModel` | 留空 | VS Code 视觉回退（`vendor/id`）。高级设置，默认隐藏；用 **配置视觉代理** 面板改 |
| `visionPrompt` | 内置 OCR 优先 prompt | 发给**描述模型**的指令（proxy）。在 `settings.json` 改，不在视觉代理面板 |
| `imageHandlingPrompt` | 内置 | MCP 系统指令（每个 MCP 回合）。在 `settings.json` 编辑 |
| `imageStoredPrompt` | 内置 | MCP 每张图的路径提示（`{0}` 标签，`{1}` 路径）。在 `settings.json` 编辑 |
| `mcp.imageCleanupMode` | `manual` | 已存 MCP 图片：`manual` / `ttl-7d` |
| `mcp.imageCapableTools` | `[]` | 额外视为识图工具的 Copilot 运行时 ID |
| `ponytailMode` | `full` | `off` / `lite` / `full` / `ultra` |
| `codeSimplifier` | `true` | 代码精简器 |
| `stripThinkTags` | `auto` | 剥离泄漏推理标签 |
| `rules` | `[]` | 编码请求注入的用户规则 |
| `allowExtraTools` | `false` | Swarm 转发 MCP 工具（实验性） |
| `auditFreeModelProbeMs` | `6000` | 免费模型探针超时（500–30000 ms） |
| `debugMode` | `minimal` | `minimal` / `metadata` / `verbose` |
| `experimental.stabilizeToolList` | `false` | 实验性工具列表稳定 |

示例 — 添加免费模型、给自定义 slug 打开 native 识图，以及一条项目规则：

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

## 排错

### Agent 窗口看不到模型

```json
{
  "extensions.supportAgentsWindow": {
    "wylasdasd.openrouter-for-copilot": true
  }
}
```

### HTTP 402 余额不足

在 [openrouter.ai/activity](https://openrouter.ai/activity) 充值，或改用 `:free` 模型。运行 **OpenRouter: 查询用量**。

### HTTP 404 模型不存在

运行 **OpenRouter: 刷新模型列表**，从 [openrouter.ai/models](https://openrouter.ai/models) 选择当前可用 slug。

### Utility 模型 BYOK 报错

已知 VS Code 回归 — [microsoft/vscode#324007](https://github.com/microsoft/vscode/issues/324007)。默认 `modelIdOverrides` 将 `copilot-utility*` 映射到 `deepseek/deepseek-chat`。

### 图片被忽略，或只有文字描述没有原图像素

1. 在 [openrouter.ai/models](https://openrouter.ai/models) 确认所选模型确实支持图片。自定义 slug 需要 `"imageInput": true`。
2. 检查 `visionMode`：`proxy` 永远先描述；`native` 只在模型标明识图（或你强制全局 native）时发送字节。
3. 代理失败时运行 **OpenRouter: 配置视觉代理** → **测试**，或 **OpenRouter: 显示日志**。

### MCP 视觉报错

MCP 需要工具调用 **并且** 有识图工具。两者都没有、也没配视觉代理时请求会失败。启用带本地图片路径的工具、把 ID 写入 `mcp.imageCapableTools`，或把 `visionMode` 改回 `auto`。

### 调试日志

将 `debugMode` 设为 `metadata`，运行 **OpenRouter: 显示日志**。需要完整请求体（含 prompt 原文）时设为 `verbose`，再运行 **OpenRouter: 打开请求 Dump 目录**。

## 代码结构

`src/` 目录、启动顺序、聊天请求路径见 [docs/code-structure.zh-cn.md](docs/code-structure.zh-cn.md)。重试、目录缓存、视觉内部实现见 [docs/architecture-optimizations.md](docs/architecture-optimizations.md)。

## 致谢

本项目参考并受益于 [GLM for Copilot](https://github.com/umbrella22/GLM-for-copilot) 与 [OpenCode for Copilot](https://github.com/Abbalochdev/opencode-for-copilot)。感谢与渊源见 [docs/acknowledgements.zh-cn.md](docs/acknowledgements.zh-cn.md)。

## 许可证

[MIT](LICENSE)
