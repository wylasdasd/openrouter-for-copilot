/**
 * Dynamic model catalog from the OpenRouter API (`GET /api/v1/models`).
 *
 * OpenRouter returns full metadata (name, context, pricing, modalities,
 * supported parameters). models.dev enrichment is not applied here — see
 * `models-dev.ts` NOTE if re-enrichment is needed later.
 */

import { OPENROUTER_BASE_URL } from '../endpoint';
import { logger } from '../logger';
import { ceilCostPerMillion } from './pricing/costs';
import type { ModelDefinition, ModelPricing, PriceCategory } from '../types';
import { GLM_TOOLS_LIMIT } from './tools/consts';

const OPENROUTER_MODELS_URL = `${OPENROUTER_BASE_URL}/models`;
const MODELS_PAGE_LIMIT = 1000;

const CACHE_TTL_MS = 5 * 60 * 1000;
const FAILED_FETCH_RETRY_MS = 60 * 1000;

let cachedModels: ModelDefinition[] | undefined;
let cacheTimestamp = 0;

const CAPS_THINKING = { toolCalling: GLM_TOOLS_LIMIT, imageInput: true, thinking: true } as const;
const CAPS_STANDARD = { toolCalling: GLM_TOOLS_LIMIT, imageInput: true, thinking: false } as const;

/** Offline baseline until the first successful catalog fetch. */
const FALLBACK_MODELS: readonly ModelDefinition[] = [
	{
		id: 'deepseek/deepseek-chat',
		name: 'DeepSeek Chat',
		family: 'deepseek',
		version: 'deepseek-chat',
		detail: 'Fast, economical coding model',
		maxInputTokens: 64_000,
		maxOutputTokens: 8_192,
		capabilities: { ...CAPS_STANDARD },
		requiresThinkingParam: false,
		pricing: { USD: { cacheHitInput: 0.14, cacheMissInput: 0.14, output: 0.28 } },
		priceCategory: 'low',
	},
	{
		id: 'anthropic/claude-3.5-sonnet',
		name: 'Claude 3.5 Sonnet',
		family: 'anthropic',
		version: 'claude-3.5-sonnet',
		detail: 'Balanced reasoning and coding',
		maxInputTokens: 200_000,
		maxOutputTokens: 8_192,
		capabilities: { ...CAPS_THINKING },
		requiresThinkingParam: false,
		supportsReasoningEffort: false,
		pricing: { USD: { cacheHitInput: 3.0, cacheMissInput: 3.0, output: 15.0 } },
		priceCategory: 'high',
	},
	{
		id: 'google/gemini-2.0-flash-001',
		name: 'Gemini 2.0 Flash',
		family: 'google',
		version: 'gemini-2.0-flash-001',
		detail: 'Fast multimodal model with vision',
		maxInputTokens: 1_000_000,
		maxOutputTokens: 8_192,
		capabilities: { ...CAPS_STANDARD },
		requiresThinkingParam: false,
		pricing: { USD: { cacheHitInput: 0.1, cacheMissInput: 0.1, output: 0.4 } },
		priceCategory: 'low',
	},
	{
		id: 'openai/gpt-4o-mini',
		name: 'GPT-4o Mini',
		family: 'openai',
		version: 'gpt-4o-mini',
		detail: 'Compact general-purpose model',
		maxInputTokens: 128_000,
		maxOutputTokens: 16_384,
		capabilities: { ...CAPS_STANDARD },
		requiresThinkingParam: false,
		pricing: { USD: { cacheHitInput: 0.15, cacheMissInput: 0.15, output: 0.6 } },
		priceCategory: 'low',
	},
];

export function getFallbackModels(): readonly ModelDefinition[] {
	return FALLBACK_MODELS;
}

/**
 * Free-tier OpenRouter slugs probed by the agent swarm audit when
 * `agentRoles.*` is unset. `:free` variants only.
 */
export const FREE_MODEL_REFS: readonly { vendor: 'openrouter-for-copilot'; family: string; id: string }[] = [
	{ vendor: 'openrouter-for-copilot', family: 'meta-llama', id: 'meta-llama/llama-3.3-70b-instruct:free' },
	{ vendor: 'openrouter-for-copilot', family: 'google', id: 'google/gemini-2.0-flash-exp:free' },
	{ vendor: 'openrouter-for-copilot', family: 'deepseek', id: 'deepseek/deepseek-r1-distill-llama-70b:free' },
	{ vendor: 'openrouter-for-copilot', family: 'qwen', id: 'qwen/qwen-2.5-coder-32b-instruct:free' },
];

interface OpenRouterModelEntry {
	id: string;
	name: string;
	description?: string;
	context_length?: number;
	expiration_date?: string | null;
	architecture?: {
		input_modalities?: string[];
	};
	pricing?: {
		prompt?: string;
		completion?: string;
	};
	top_provider?: {
		context_length?: number;
		max_completion_tokens?: number;
	};
	supported_parameters?: string[];
	reasoning?: {
		mandatory?: boolean;
		default_enabled?: boolean;
	};
}

interface OpenRouterModelsResponse {
	data?: OpenRouterModelEntry[];
	total_count?: number;
	links?: { next?: string };
}

const UTILITY_MODEL_IDS = new Set(['copilot-utility', 'copilot-utility-small']);

export async function fetchOpenRouterCatalog(): Promise<readonly OpenRouterModelEntry[]> {
	const models: OpenRouterModelEntry[] = [];
	let url: string | undefined = `${OPENROUTER_MODELS_URL}?limit=${MODELS_PAGE_LIMIT}`;

	while (url) {
		try {
			const response = await fetch(url, {
				headers: { Accept: 'application/json' },
				signal: AbortSignal.timeout(15_000),
			});
			if (!response.ok) {
				logger.warn(`OpenRouter model list fetch failed (${response.status}): ${url}`);
				break;
			}
			const body = (await response.json()) as OpenRouterModelsResponse;
			if (!Array.isArray(body.data)) {
				break;
			}
			models.push(...body.data);
			const next = body.links?.next;
			url = next ? new URL(next, OPENROUTER_BASE_URL).href : undefined;
		} catch (error) {
			logger.warn(`OpenRouter model list fetch error: ${url}`, error);
			break;
		}
	}

	logger.info(`Fetched ${models.length} models from OpenRouter`);
	return models;
}

/** Placeholder display name from a slug (used before API name is available). */
export function displayNameFromId(id: string): string {
	const localId = localSlugFromId(id);
	const words: string[] = [];
	for (const segment of localId.split('-')) {
		if (/^\d+(\.\d+)*$/.test(segment)) {
			const previous = words.at(-1);
			if (previous !== undefined && /\d$/.test(previous)) {
				words[words.length - 1] += `.${segment}`;
			} else {
				words.push(segment);
			}
			continue;
		}
		words.push(casingForWord(segment));
	}
	return words.join(' ');
}

function localSlugFromId(id: string): string {
	const slash = id.lastIndexOf('/');
	const base = slash >= 0 ? id.slice(slash + 1) : id;
	return base.replace(/:free$/iu, '-free');
}

function casingForWord(segment: string): string {
	const match = segment.toLowerCase().match(/^([a-z]+)(\d.*)?$/);
	if (!match) {
		return capitalize(segment.toLowerCase());
	}
	const word = capitalize(match[1]);
	return match[2] ? `${word}${match[2]}` : word;
}

function capitalize(word: string): string {
	return word.charAt(0).toUpperCase() + word.slice(1);
}

function providerFromId(id: string): string {
	const slash = id.indexOf('/');
	return slash >= 0 ? id.slice(0, slash).toLowerCase() : 'custom';
}

function shortDetail(description: string | undefined): string {
	if (!description?.trim()) {
		return '';
	}
	const sentence = description.trim().split(/(?<=[.!?])\s+/u)[0] ?? description.trim();
	return sentence.length > 160 ? `${sentence.slice(0, 157)}…` : sentence;
}

function parsePricing(pricing: OpenRouterModelEntry['pricing']): ModelPricing | undefined {
	const prompt = Number.parseFloat(pricing?.prompt ?? '');
	const completion = Number.parseFloat(pricing?.completion ?? '');
	if (!Number.isFinite(prompt) || !Number.isFinite(completion)) {
		return undefined;
	}
	const cacheMissInput = ceilCostPerMillion(prompt * 1_000_000);
	const output = ceilCostPerMillion(completion * 1_000_000);
	return { cacheHitInput: cacheMissInput, cacheMissInput, output };
}

function derivePriceCategory(promptPerToken: number): PriceCategory {
	const perM = promptPerToken * 1_000_000;
	if (perM <= 0) {
		return 'low';
	}
	if (perM < 1) {
		return 'low';
	}
	if (perM < 5) {
		return 'medium';
	}
	if (perM < 20) {
		return 'high';
	}
	return 'very_high';
}

function isExpired(expirationDate: string | null | undefined): boolean {
	if (!expirationDate) {
		return false;
	}
	const ts = Date.parse(expirationDate);
	return Number.isFinite(ts) && ts < Date.now();
}

function mapOpenRouterModel(entry: OpenRouterModelEntry): ModelDefinition {
	const params = entry.supported_parameters ?? [];
	const thinking =
		params.includes('reasoning') ||
		params.includes('include_reasoning') ||
		entry.reasoning !== undefined;
	const toolCalling = params.includes('tools');
	const imageInput = entry.architecture?.input_modalities?.includes('image') ?? false;
	const promptPerToken = Number.parseFloat(entry.pricing?.prompt ?? '0');
	const pricing = parsePricing(entry.pricing);
	const localSlug = localSlugFromId(entry.id);

	return {
		id: entry.id,
		name: entry.name?.trim() || displayNameFromId(entry.id),
		family: providerFromId(entry.id),
		version: localSlug,
		detail: shortDetail(entry.description),
		maxInputTokens: entry.context_length ?? entry.top_provider?.context_length ?? 128_000,
		maxOutputTokens: entry.top_provider?.max_completion_tokens ?? 32_768,
		capabilities: {
			toolCalling: toolCalling ? GLM_TOOLS_LIMIT : false,
			imageInput,
			thinking,
		},
		requiresThinkingParam: entry.reasoning?.mandatory === true,
		supportsReasoningEffort: params.includes('reasoning_effort'),
		deprecated: isExpired(entry.expiration_date),
		...(pricing ? { pricing: { USD: pricing }, priceCategory: derivePriceCategory(promptPerToken) } : {}),
	};
}

function generateUtilityModel(id: string): ModelDefinition {
	return {
		id,
		name: id,
		family: 'utility',
		version: id,
		maxInputTokens: 128_000,
		maxOutputTokens: 8_192,
		capabilities: { toolCalling: true, imageInput: false, thinking: false },
		requiresThinkingParam: false,
		detail: '',
	};
}

export function buildDynamicModels(
	catalog: readonly OpenRouterModelEntry[],
	customModels: readonly ModelDefinition[],
	fallbackModels: readonly ModelDefinition[],
): ModelDefinition[] {
	const byId = new Map<string, ModelDefinition>();

	for (const model of fallbackModels) {
		byId.set(model.id, model);
	}

	for (const entry of catalog) {
		if (!entry.id) {
			continue;
		}
		byId.set(entry.id, mapOpenRouterModel(entry));
	}

	for (const id of UTILITY_MODEL_IDS) {
		if (!byId.has(id)) {
			byId.set(id, generateUtilityModel(id));
		}
	}

	for (const model of customModels) {
		byId.set(model.id, model);
	}

	return [...byId.values()];
}

export async function getDynamicModels(
	customModels: readonly ModelDefinition[],
	fallbackModels: readonly ModelDefinition[],
): Promise<readonly ModelDefinition[]> {
	const now = Date.now();
	if (cachedModels && now - cacheTimestamp < CACHE_TTL_MS) {
		return cachedModels;
	}

	const catalog = await fetchOpenRouterCatalog();

	if (catalog.length === 0) {
		logger.warn('OpenRouter API returned no models — falling back to static model list');
		const byId = new Map(fallbackModels.map((m) => [m.id, m]));
		for (const id of UTILITY_MODEL_IDS) {
			if (!byId.has(id)) {
				byId.set(id, generateUtilityModel(id));
			}
		}
		for (const model of customModels) {
			byId.set(model.id, model);
		}
		cachedModels = [...byId.values()];
		cacheTimestamp = now - (CACHE_TTL_MS - FAILED_FETCH_RETRY_MS);
		return cachedModels;
	}

	cachedModels = buildDynamicModels(catalog, customModels, fallbackModels);
	cacheTimestamp = now;
	return cachedModels;
}

export function isDynamicModelsStale(): boolean {
	return !cachedModels || Date.now() - cacheTimestamp >= CACHE_TTL_MS;
}

export function invalidateModelCache(): void {
	cachedModels = undefined;
	cacheTimestamp = 0;
}
