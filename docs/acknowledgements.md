# Acknowledgements

This project would not exist without the Copilot Chat provider work that came before it. I learned from those codebases, reused their ideas, and owe the authors a real debt.

## GLM for Copilot

[GLM for VS Code Copilot](https://github.com/umbrella22/GLM-for-copilot) (`umbrella22/GLM-for-copilot`) showed how a third-party model vendor can sit inside GitHub Copilot Chat: `LanguageModelChatProvider`, picker rows, streaming, tools, and especially **vision** — native image bytes, a vision-proxy describer, and optional MCP local-file routing.

Thank you to **umbrella22** and everyone who contributed to GLM for Copilot. The image pipeline in this repo still follows that design. Any remaining `GLMChatProvider` names in the source are a reminder of that origin, not a claim that this is still a GLM-only extension.

## OpenCode for Copilot

**[OpenCode for Copilot](https://github.com/Abbalochdev/opencode-for-copilot)** is the VS Code extension this repository grew out of: settings shape, request/stream/tool loop, `@swarm` (research → review → implement), Ponytail, and the Copilot-provider shell. This project retargets that work to the [OpenRouter](https://openrouter.ai) API (catalog + OpenAI-compatible chat completions) instead of OpenCode/GLM endpoints.

Thank you to **Abbalochdev** and everyone who contributed to [OpenCode for Copilot](https://github.com/Abbalochdev/opencode-for-copilot). Standing on that implementation saved months of wiring Copilot Chat by hand. Bugs and OpenRouter-specific behavior here are mine; the solid bones are theirs.

## What this repo is

OpenRouter for Copilot is a **downstream** project: same Copilot Chat integration idea, different API. It is not an official GLM, OpenCode, or OpenRouter product. Please star and support the upstream projects directly.

- [GLM for VS Code Copilot](https://github.com/umbrella22/GLM-for-copilot)
- [OpenCode for Copilot](https://github.com/Abbalochdev/opencode-for-copilot) (`Abbalochdev/opencode-for-copilot`)

Technical migration notes: [porting-roadmap.md](porting-roadmap.md).
