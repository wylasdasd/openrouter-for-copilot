import type { ApiProtocol } from './types';

// Hosts of the GLM/Z.ai platforms. Still sniffed so users who point `baseUrl`
// at them manually get the right error mapping, request flags, and CNY pricing.
export const GLM_CN_API_HOST = 'open.bigmodel.cn';
export const GLM_CN_LEGACY_API_HOST = 'dev.bigmodel.cn';
export const GLM_INTERNATIONAL_API_HOST = 'api.z.ai';

// ---- OpenRouter (https://openrouter.ai/docs) ----

export const OPENROUTER_API_HOST = 'openrouter.ai';
export const OPENROUTER_BASE_URL = `https://${OPENROUTER_API_HOST}/api/v1`;
export const OPENROUTER_API_KEY_URL = 'https://openrouter.ai/keys';
export const OPENROUTER_ACTIVITY_URL = 'https://openrouter.ai/activity';

/** Default chat-completions base URL when `baseUrl` is unset. */
export function resolveDefaultBaseUrl(): string {
	return OPENROUTER_BASE_URL;
}

export function isOpenRouterBaseUrl(baseUrl: string): boolean {
	try {
		return new URL(normalizeBaseUrl(baseUrl)).hostname.toLowerCase() === OPENROUTER_API_HOST;
	} catch {
		return false;
	}
}

/** OpenRouter requests always use the OpenAI-compatible wire protocol. */
export function resolveDefaultApiProtocol(): ApiProtocol {
	return 'openai';
}

// ---- Legacy OpenCode hosts (manual `baseUrl` sniffing + error mapping only) ----

export const OPENCODE_GO_API_HOST = 'opencode.ai';
export const OPENCODE_GO_OPENAI_BASE_URL = `https://${OPENCODE_GO_API_HOST}/zen/go/v1`;
export const OPENCODE_GO_ANTHROPIC_BASE_URL = `https://${OPENCODE_GO_API_HOST}/zen/go`;
export const OPENCODE_ZEN_OPENAI_BASE_URL = `https://${OPENCODE_GO_API_HOST}/zen/v1`;
export const OPENCODE_ZEN_ANTHROPIC_BASE_URL = `https://${OPENCODE_GO_API_HOST}/zen`;

/** The GLM/Z.ai platforms still recognized for manual `baseUrl` overrides. */
export type OfficialGLMPlatform = 'zhipu' | 'zai';

export function identifyOfficialGLMPlatform(baseUrl: string): OfficialGLMPlatform | undefined {
	try {
		const host = new URL(baseUrl).hostname.toLowerCase();
		if (host === GLM_INTERNATIONAL_API_HOST) {
			return 'zai';
		}
		if (host === GLM_CN_API_HOST || host === GLM_CN_LEGACY_API_HOST) {
			return 'zhipu';
		}
		return undefined;
	} catch {
		return undefined;
	}
}

export function isOfficialGLMBaseUrl(baseUrl: string): boolean {
	return identifyOfficialGLMPlatform(baseUrl) !== undefined;
}

/** Whether a base URL points at the legacy OpenCode gateway (error mapping only). */
export function isOpencodeBaseUrl(baseUrl: string): boolean {
	try {
		return new URL(normalizeBaseUrl(baseUrl)).hostname.toLowerCase() === OPENCODE_GO_API_HOST;
	} catch {
		return false;
	}
}

export function normalizeBaseUrl(baseUrl: string): string {
	return baseUrl.trim().replace(/\/+$/u, '');
}
