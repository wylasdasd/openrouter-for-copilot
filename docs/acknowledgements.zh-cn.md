# 致谢

这个扩展能做成现在这样，离不开前面两个 Copilot Chat 供应商项目。我读过、对照过、也借鉴了它们的实现。写在这里，是真心说一声谢谢。

## GLM for Copilot

[GLM for VS Code Copilot](https://github.com/umbrella22/GLM-for-copilot)（`umbrella22/GLM-for-copilot`）把第三方模型接到 GitHub Copilot Chat 里：`LanguageModelChatProvider`、模型选择器、流式输出、工具调用，以及 **视觉** 三条路——原生发图片字节、视觉代理先转文字、可选 MCP 本地文件。

感谢 **umbrella22** 和 GLM for Copilot 的各位贡献者。本仓库的识图路由仍然跟着那套设计走。源码里还留着 `GLMChatProvider` 这个类名，是渊源，不是说这还是一个只接 GLM 的扩展。

## OpenCode for Copilot

**[OpenCode for Copilot](https://github.com/Abbalochdev/opencode-for-copilot)** 是本仓库直接长出来的那一截：设置结构、请求/流式/工具循环、`@swarm`（研究 → 评审 → 实现）、Ponytail，以及整套 Copilot 供应商骨架。这边做的事，是把它改接到 [OpenRouter](https://openrouter.ai)（目录 + OpenAI 兼容 chat completions），不再走 OpenCode / GLM 的端点。

感谢 **Abbalochdev** 以及 [OpenCode for Copilot](https://github.com/Abbalochdev/opencode-for-copilot) 的各位贡献者。没有那套已经能跑的 Copilot 接入，我不可能从零把供应商、swarm 和视觉代理一次接好。OpenRouter 相关的改动和锅归这边；骨架是他们的。

## 本仓库的位置

OpenRouter for Copilot 是**下游**项目：同一类 Copilot Chat 接入思路，换了 API。不是 GLM、OpenCode 或 OpenRouter 的官方产品。如果这些工作帮到了你，请直接给上游点星、提 issue、参与贡献。

- [GLM for VS Code Copilot](https://github.com/umbrella22/GLM-for-copilot)
- [OpenCode for Copilot](https://github.com/Abbalochdev/opencode-for-copilot)（`Abbalochdev/opencode-for-copilot`）

技术迁移说明见 [porting-roadmap.md](porting-roadmap.md)。
