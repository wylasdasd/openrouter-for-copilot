import { getFallbackModels } from './provider/openrouter-models';
import type { ModelDefinition } from './types';

/**
 * Compile-time constants shared across the extension.
 *
 * These do NOT depend on the VS Code runtime (no workspace configuration,
 * no secrets API). For run-time settings reads see `config.ts`.
 */

/** VS Code configuration section prefix for all extension settings. */
export const CONFIG_SECTION = 'openrouter-for-copilot';

/** Language model vendor registered with VS Code Copilot Chat.
 *  Must not be `openrouter` — Copilot Chat's built-in BYOK already owns that
 *  id, so a colliding contribution never shows up under Other Models. */
export const MODEL_VENDOR = 'openrouter-for-copilot';

/**
 * Sibling fork settings section. Only read once during
 * `migrateLegacySettings` — never at runtime — so OpenCode / GLM / OpenRouter
 * extensions can be installed side by side with independent settings.
 */
export const LEGACY_CONFIG_SECTION = 'opencode-for-copilot';

export const EXTERNAL_URLS = {
	openrouter: {
		apiKeys: 'https://openrouter.ai/keys',
		usage: 'https://openrouter.ai/activity',
	},
} as const;

/** URI path handled by this extension to reveal the output log. */
export const SHOW_LOGS_URI_PATH = '/showLogs';

/** URI path handled by this extension to open API key configuration. */
export const CONFIGURE_API_KEY_URI_PATH = '/setApiKey';

/** URI path handled by this extension to open vision model configuration. */
export const SET_VISION_MODEL_URI_PATH = '/setVisionModel';

// VS Code's internal LanguageModelChatMessageRole.System is not exposed in @types/vscode.
export const LANGUAGE_MODEL_CHAT_SYSTEM_ROLE = 3;

// ---- Secret keys ----

/** SecretStorage key for the API key. */
export const API_KEY_SECRET = 'openrouter-for-copilot.apiKey';

/**
 * Legacy SecretStorage keys from sibling forks. Read once during
 * `migrateLegacySecrets` only — never written after migration.
 */
export const LEGACY_API_KEY_SECRETS = [
	'glm-copilot.apiKey',
	'glm-copilot.apiKey.go',
	'glm-copilot.apiKey.zen',
] as const;

/** memento key tracking whether the welcome walkthrough has been shown. */
export const WELCOME_SHOWN_KEY = 'openrouter-for-copilot.welcomeShown';

// ---- Walkthrough ----

/** Walkthrough contribution ID. */
export const WALKTHROUGH_ID = 'wylasdasd.openrouter-for-copilot#openrouterGettingStarted';

// ---- Model registry ----
//
// Live source of truth: the OpenRouter catalog fetched at runtime
// (`provider/openrouter-models.ts`), merged with user custom models. The static
// list below is only a minimal offline baseline (before the first fetch
// completes, or if the catalog endpoint becomes unreachable).

/** Available models exposed through the language model provider. */
export const MODELS: ModelDefinition[] = [...getFallbackModels()];
