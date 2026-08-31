import { beforeEach, describe, expect, it } from 'vitest';
import * as vscode from 'vscode';
import { listProviderModels } from '../../src/config';
import { MODELS } from '../../src/consts';
import {
	getConfiguredThinkingEffort,
	toChatInfo,
} from '../../src/provider/models';
import { findModelsDevEntry, mergeWithModelsDev, type ModelsDevModel } from '../../src/provider/models-dev';
import {
	displayNameFromId,
	getDynamicModels,
	invalidateModelCache,
} from '../../src/provider/openrouter-models';
import { __clearConfigurationValues, __setConfigurationValue } from '../support/vscode.mock';

describe('displayNameFromId (generic placeholder until API name is available)', () => {
	it('title-cases words and joins version segments from OpenRouter slugs', () => {
		expect(displayNameFromId('anthropic/claude-opus-4-8')).toBe('Claude Opus 4.8');
		expect(displayNameFromId('z-ai/glm-5.3')).toBe('Glm 5.3');
		expect(displayNameFromId('qwen/qwen3.8-max')).toBe('Qwen3.8 Max');
		expect(displayNameFromId('meta-llama/llama-3.3-70b-instruct:free')).toBe(
			'Llama 3.3 70b Instruct Free',
		);
	});
});

describe('offline fallback baseline', () => {
	beforeEach(() => {
		__clearConfigurationValues();
	});

	it('ships four offline baseline models before the first catalog fetch', () => {
		const models = listProviderModels();

		expect(models.map((m) => m.id)).toEqual([
			'deepseek/deepseek-chat',
			'anthropic/claude-3.5-sonnet',
			'google/gemini-2.0-flash-001',
			'openai/gpt-4o-mini',
		]);
	});

	it('serves the whole baseline regardless of baseUrl override', () => {
		__setConfigurationValue('openrouter-for-copilot.baseUrl', 'https://proxy.example.com/v1');
		const infos = listProviderModels().map((m) => toChatInfo(m, true));
		expect(infos.every((m) => m.isUserSelectable)).toBe(true);
	});
});

describe('OpenRouter catalog pipeline', () => {
	const CATALOG_ENTRIES = [
		{
			id: 'deepseek/deepseek-chat',
			name: 'DeepSeek Chat',
			description: 'Fast coding model.',
			context_length: 64_000,
			pricing: { prompt: '0.00000014', completion: '0.00000028' },
			supported_parameters: ['tools', 'max_tokens'],
			architecture: { input_modalities: ['text'] },
		},
		{
			id: 'anthropic/claude-3.7-sonnet',
			name: 'Claude 3.7 Sonnet',
			description: 'Reasoning model.',
			context_length: 200_000,
			pricing: { prompt: '0.000003', completion: '0.000015' },
			supported_parameters: ['tools', 'reasoning', 'max_tokens'],
			architecture: { input_modalities: ['text', 'image'] },
		},
	];

	it('merges fetched OpenRouter models with fallbacks and utility aliases', async () => {
		const realFetch = globalThis.fetch;
		globalThis.fetch = (async (input: RequestInfo | URL) => {
			const url = String(input);
			if (url.includes('openrouter.ai/api/v1/models')) {
				return new Response(JSON.stringify({ data: CATALOG_ENTRIES, total_count: 2 }));
			}
			throw new Error('offline');
		}) as typeof fetch;

		try {
			invalidateModelCache();
			const models = await getDynamicModels([], MODELS);

			expect(models.some((m) => m.id === 'deepseek/deepseek-chat')).toBe(true);
			expect(models.some((m) => m.id === 'anthropic/claude-3.7-sonnet')).toBe(true);
			expect(models.some((m) => m.id === 'copilot-utility')).toBe(true);
			expect(models.some((m) => m.id === 'copilot-utility-small')).toBe(true);
			const claude = models.find((m) => m.id === 'anthropic/claude-3.7-sonnet');
			expect(claude?.capabilities.thinking).toBe(true);
			expect(claude?.capabilities.imageInput).toBe(true);
		} finally {
			globalThis.fetch = realFetch;
			invalidateModelCache();
		}
	});

	it('falls back to the static list when the catalog is unreachable', async () => {
		const realFetch = globalThis.fetch;
		globalThis.fetch = (async () => {
			throw new Error('offline');
		}) as typeof fetch;

		try {
			invalidateModelCache();
			const models = await getDynamicModels([], MODELS);

			expect(models.map((m) => m.id)).toEqual([
				...MODELS.map((m) => m.id),
				'copilot-utility',
				'copilot-utility-small',
			]);
		} finally {
			globalThis.fetch = realFetch;
			invalidateModelCache();
		}
	});

	it('ceils per-million pricing to 4 decimals (avoids 0.7999999 float noise)', async () => {
		const realFetch = globalThis.fetch;
		globalThis.fetch = (async () =>
			new Response(
				JSON.stringify({
					data: [
						{
							id: 'aion-labs/aion-2.0',
							name: 'Aion 2.0',
							context_length: 128_000,
							pricing: { prompt: '0.0000008', completion: '0.0000016' },
							supported_parameters: ['tools'],
							architecture: { input_modalities: ['text'] },
						},
					],
				}),
			)) as typeof fetch;

		try {
			invalidateModelCache();
			const models = await getDynamicModels([], MODELS);
			const aion = models.find((m) => m.id === 'aion-labs/aion-2.0');
			expect(aion?.pricing?.USD).toEqual({
				cacheHitInput: 0.8,
				cacheMissInput: 0.8,
				output: 1.6,
			});
			const info = toChatInfo(aion!, true, 'USD');
			expect(info.inputCost).toBe(0.8);
			expect(info.outputCost).toBe(1.6);
			expect(info.cacheCost).toBe(0.8);
		} finally {
			globalThis.fetch = realFetch;
			invalidateModelCache();
		}
	});
});

describe('model metadata helpers', () => {
	beforeEach(() => {
		__clearConfigurationValues();
	});

	it('normalizes configured thinking effort aliases', () => {
		expect(
			getConfiguredThinkingEffort({
				modelConfiguration: { reasoningEffort: 'disabled' },
			}),
		).toBe('none');
		expect(
			getConfiguredThinkingEffort({
				configuration: { thinking_effort: 'balanced' },
			}),
		).toBe('high');
		expect(
			getConfiguredThinkingEffort({
				modelConfiguration: { thinkingEffort: 'deep' },
			}),
		).toBe('max');
	});

	it('defaults thinking effort to max when no valid value is configured', () => {
		expect(getConfiguredThinkingEffort({})).toBe('max');
		expect(
			getConfiguredThinkingEffort({
				modelConfiguration: { reasoningEffort: 'surprise' },
			}),
		).toBe('max');
	});

	it('shows locked model metadata before an API key is configured', () => {
		const info = toChatInfo(MODELS[0], false, 'CNY');

		expect(info.statusIcon).toBeInstanceOf(vscode.ThemeIcon);
		expect(info.statusIcon?.id).toBe('warning');
		expect(info.detail).toBe('Please run OpenRouter: Set API Key to configure.');
		expect(info.tooltip).toBe('Please run OpenRouter: Set API Key to configure.');
		expect(info.isBYOK).toBe(true);
		expect(info.isUserSelectable).toBe(true);
	});

	it('hides models.dev-deprecated models from the picker', () => {
		const info = toChatInfo({ ...MODELS[0], deprecated: true }, true, 'USD');

		expect(info.isUserSelectable).toBe(false);
		expect(info.statusIcon?.id).toBe('warning');
		expect(info.detail).toBe(
			'Deprecated by the provider — kept for existing chats; pick another model.',
		);
	});

	it('shows fallback display names for offline baseline models', () => {
		const infos = listProviderModels().map((model) => toChatInfo(model, true, 'USD'));
		const deepseek = infos.find((info) => info.id === 'deepseek/deepseek-chat');
		const gemini = infos.find((info) => info.id === 'google/gemini-2.0-flash-001');

		expect(deepseek?.name).toBe('op: DeepSeek Chat');
		expect(gemini?.name).toBe('op: Gemini 2.0 Flash');
		expect(deepseek?.id).toBe('deepseek/deepseek-chat');
		expect(deepseek?.detail).toBe('op: DeepSeek Chat');
		expect(deepseek?.tooltip).toBe('Fast, economical coding model');
	});

	it('does not double-prefix names that already start with op:', () => {
		const info = toChatInfo({ ...MODELS[0], name: 'op: DeepSeek Chat' }, true, 'USD');
		expect(info.name).toBe('op: DeepSeek Chat');
	});

	it('prefixes custom models in the picker without changing their id', () => {
		__setConfigurationValue('openrouter-for-copilot.customModels', ['team-coder']);

		const info = listProviderModels()
			.map((model) => toChatInfo(model, true, 'USD'))
			.find((entry) => entry.id === 'team-coder');

		expect(info?.name).toBe('op: team-coder');
		expect(info?.id).toBe('team-coder');
	});

	it('reports capabilities and price metadata when unlocked', () => {
		const info = toChatInfo(MODELS[0], true, 'USD');

		expect(info.statusIcon).toBeUndefined();
		expect(info.capabilities).toEqual({
			toolCalling: MODELS[0].capabilities.toolCalling,
			imageInput: true,
		});
		expect(info.configurationSchema).toBeUndefined();
		expect(info.inputCost).toBe(0.14);
		expect(info.outputCost).toBe(0.28);
		expect(info.cacheCost).toBe(0.14);
		expect(info.priceCategory).toBe('low');
	});

	it('includes custom models in picker metadata with Vision Proxy by default', () => {
		__setConfigurationValue('openrouter-for-copilot.customModels', [
			'team-coder',
			{ id: 'no-thinking', thinking: false },
		]);

		const infos = listProviderModels().map((model) => toChatInfo(model, true, 'USD'));
		const custom = infos.find((info) => info.id === 'team-coder');
		const noThinking = infos.find((info) => info.id === 'no-thinking');

		expect(infos.map((info) => info.id)).toEqual([
			...MODELS.map((model) => model.id),
			'team-coder',
			'no-thinking',
		]);
		expect(custom).toMatchObject({
			id: 'team-coder',
			name: 'op: team-coder',
			detail: 'op: team-coder',
			tooltip: 'Custom OpenAI-compatible model',
			capabilities: {
				toolCalling: true,
				imageInput: false,
			},
		});
		expect(custom?.configurationSchema?.properties.reasoningEffort.default).toBe('max');
		expect(noThinking?.capabilities.imageInput).toBe(false);
		expect(noThinking?.configurationSchema).toBeUndefined();
	});
});

describe('findModelsDevEntry', () => {
	it('matches a bare ID keyed directly by models.dev', () => {
		const snapshot = new Map([
			['deepseek/deepseek-v4-flash', { id: 'deepseek/deepseek-v4-flash', limit: { context: 1_000_000 } }],
		]);
		expect(findModelsDevEntry(snapshot, 'deepseek-v4-flash')?.limit?.context).toBe(1_000_000);
	});

	it('matches a provider-prefixed models.dev id field', () => {
		const snapshot = new Map([
			['deepseek-v4-flash', { id: 'deepseek/deepseek-v4-flash', limit: { context: 1_000_000 } }],
		]);
		expect(findModelsDevEntry(snapshot, 'deepseek-v4-flash')?.limit?.context).toBe(1_000_000);
	});

	it('prefers the shallowest provider path over mirrors with the same id', () => {
		const snapshot = new Map<string, ModelsDevModel>([
			['nvidia/deepseek-ai/deepseek-v4-flash', { id: 'nvidia/deepseek-ai/deepseek-v4-flash', limit: { context: 200_000 } }],
			['deepseek/deepseek-v4-flash', { id: 'deepseek/deepseek-v4-flash', limit: { context: 1_000_000 } }],
		]);
		expect(findModelsDevEntry(snapshot, 'deepseek-v4-flash')?.limit?.context).toBe(1_000_000);
	});

	it('rejects near-miss ids (case/suffix differences)', () => {
		const snapshot = new Map<string, ModelsDevModel>([
			['baseten/deepseek-ai/DeepSeek-V4-Flash-0731', { id: 'baseten/deepseek-ai/DeepSeek-V4-Flash-0731' }],
			['nvidia/deepseek-ai/DeepSeek-V4-Flash-0731', { id: 'nvidia/deepseek-ai/DeepSeek-V4-Flash-0731' }],
		]);
		expect(findModelsDevEntry(snapshot, 'deepseek-v4-flash')).toBeUndefined();
	});

	it('matches the opencode-gateway free tier id', () => {
		const snapshot = new Map<string, ModelsDevModel>([
			['opencode/deepseek-v4-flash-free', { id: 'opencode/deepseek-v4-flash-free', limit: { context: 1_000_000 } }],
		]);
		expect(findModelsDevEntry(snapshot, 'deepseek-v4-flash-free')?.limit?.context).toBe(1_000_000);
	});

	it('returns undefined for an unmatched ID (overlay wins unchanged)', () => {
		const snapshot = new Map<string, ModelsDevModel>([
			['glm-5.2', { id: 'glm/glm-5.2', limit: { context: 1_000_000 } }],
		]);
		expect(findModelsDevEntry(snapshot, 'deepseek-v4-flash')).toBeUndefined();
	});
});

describe('mergeWithModelsDev', () => {
	const base: Parameters<typeof mergeWithModelsDev>[0] = {
		id: 'deepseek-v4-flash',
		name: 'DeepSeek V4 Flash',
		family: 'deepseek',
		version: 'v4-flash',
		detail: 'Fast and economical coding model',
		maxInputTokens: 128_000,
		maxOutputTokens: 131_072,
		capabilities: { toolCalling: true, imageInput: true, thinking: false },
		requiresThinkingParam: false,
		priceCategory: 'low',
	};

	it('keeps the short overlay detail (no paragraph text in the picker)', () => {
		const merged = mergeWithModelsDev(base, {
			id: 'deepseek/deepseek-v4-flash',
			description: 'DeepSeek V4 Flash is a fast, economical coding model with a very long description that would wrap into a paragraph in the model picker.',
			limit: { context: 1_000_000, output: 384_000 },
		});
		expect(merged.detail).toBe('Fast and economical coding model');
		expect(merged.maxInputTokens).toBe(1_000_000);
		expect(merged.maxOutputTokens).toBe(384_000);
	});

	it('never surfaces the models.dev paragraph description as the picker detail', () => {
		const merged = mergeWithModelsDev({ ...base, detail: '' }, {
			id: 'deepseek/deepseek-v4-flash',
			description: 'Fallback description text that would wrap into a paragraph in the picker',
		});
		expect(merged.detail).toBe('');
	});
});
