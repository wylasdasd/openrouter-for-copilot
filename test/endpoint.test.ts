import { describe, expect, it } from 'vitest';
import { getPricingCurrencyForBaseUrl } from '../src/provider/pricing/currency';
import {
	GLM_CN_API_HOST,
	GLM_CN_LEGACY_API_HOST,
	GLM_INTERNATIONAL_API_HOST,
	OPENCODE_GO_ANTHROPIC_BASE_URL,
	OPENCODE_GO_OPENAI_BASE_URL,
	OPENCODE_ZEN_OPENAI_BASE_URL,
	OPENROUTER_API_KEY_URL,
	OPENROUTER_BASE_URL,
	identifyOfficialGLMPlatform,
	isOfficialGLMBaseUrl,
	isOpenRouterBaseUrl,
	isOpencodeBaseUrl,
	normalizeBaseUrl,
	resolveDefaultApiProtocol,
	resolveDefaultBaseUrl,
} from '../src/endpoint';

describe('endpoint helpers', () => {
	it('normalizes trailing slashes and surrounding whitespace', () => {
		expect(normalizeBaseUrl(' https://open.bigmodel.cn/api/paas/v4/// ')).toBe(
			'https://open.bigmodel.cn/api/paas/v4',
		);
	});

	it('identifies official GLM platforms by host', () => {
		expect(identifyOfficialGLMPlatform(`https://${GLM_INTERNATIONAL_API_HOST}/api/paas/v4`)).toBe(
			'zai',
		);
		expect(identifyOfficialGLMPlatform(`https://${GLM_CN_API_HOST}/api/paas/v4`)).toBe('zhipu');
		expect(identifyOfficialGLMPlatform(`https://${GLM_CN_LEGACY_API_HOST}/api/paas/v4`)).toBe(
			'zhipu',
		);
	});

	it('does not classify custom or invalid URLs as official', () => {
		expect(identifyOfficialGLMPlatform('https://proxy.example.com/v1')).toBeUndefined();
		expect(identifyOfficialGLMPlatform('not a url')).toBeUndefined();
		expect(isOfficialGLMBaseUrl('https://proxy.example.com/v1')).toBe(false);
	});

	it('identifies OpenRouter URLs', () => {
		expect(isOpenRouterBaseUrl(OPENROUTER_BASE_URL)).toBe(true);
		expect(isOpenRouterBaseUrl('https://openrouter.ai/api/v1/chat/completions')).toBe(true);
		expect(isOpenRouterBaseUrl('https://proxy.example.com/v1')).toBe(false);
	});

	it('still identifies legacy OpenCode catalog URLs', () => {
		expect(isOpencodeBaseUrl(OPENCODE_GO_OPENAI_BASE_URL)).toBe(true);
		expect(isOpencodeBaseUrl(OPENCODE_GO_ANTHROPIC_BASE_URL)).toBe(true);
		expect(isOpencodeBaseUrl(OPENCODE_ZEN_OPENAI_BASE_URL)).toBe(true);
		expect(isOpencodeBaseUrl(OPENROUTER_BASE_URL)).toBe(false);
	});

	it('defaults to OpenRouter base URL and OpenAI protocol', () => {
		expect(resolveDefaultBaseUrl()).toBe(OPENROUTER_BASE_URL);
		expect(resolveDefaultApiProtocol()).toBe('openai');
		expect(OPENROUTER_API_KEY_URL).toBe('https://openrouter.ai/keys');
	});

	it('shows USD pricing for OpenRouter and legacy OpenCode hosts', () => {
		expect(getPricingCurrencyForBaseUrl(OPENROUTER_BASE_URL)).toBe('USD');
		expect(getPricingCurrencyForBaseUrl(OPENCODE_GO_OPENAI_BASE_URL)).toBe('USD');
		expect(getPricingCurrencyForBaseUrl('https://proxy.example.com/v1')).toBeUndefined();
	});
});
