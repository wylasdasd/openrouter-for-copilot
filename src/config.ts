import vscode from 'vscode';
import { CONFIG_SECTION, LEGACY_CONFIG_SECTION, MODELS } from './consts';
import {
	normalizeBaseUrl,
	OPENROUTER_API_KEY_URL,
	resolveDefaultApiProtocol,
	resolveDefaultBaseUrl,
} from './endpoint';
import {
	getDynamicModels
} from './provider/openrouter-models';
import type { PonytailMode } from './provider/ponytail';
import type {
	ApiProtocol,
	CustomModelConfig,
	ModelDefinition,
	ModelVisionMode,
} from './types';

export type DebugMode = 'minimal' | 'metadata' | 'verbose';

const CUSTOM_MODEL_DETAIL = 'Custom OpenAI-compatible model';
const CUSTOM_MODEL_MAX_INPUT_TOKENS = 200_000;
const CUSTOM_MODEL_MAX_OUTPUT_TOKENS = 131_072;

/**
 * Resolve the API base URL.
 *
 * Resolution order:
 *   1. `baseUrl` override (proxy / custom gateway)
 *   2. OpenRouter default (`https://openrouter.ai/api/v1`)
 */
export function getBaseUrl(): string {
	return getBaseUrlOverride() ?? resolveDefaultBaseUrl();
}

export function getBaseUrlOverride(): string | undefined {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
	const value = config.get<string>('baseUrl', '');
	const normalized = normalizeBaseUrl(typeof value === 'string' ? value : '');
	return normalized || undefined;
}

// ---- One-time legacy settings migration (opencode-for-copilot -> openrouter-for-copilot) ----

const LEGACY_SETTING_KEYS = [
	'agentRoles',
	'baseUrl',
	'endpoint',
	'maxTokens',
	'experimental.stabilizeToolList',
	'modelIdOverrides',
	'customModels',
	'visionModel',
	'visionPrompt',
	'debugMode',
	'ponytailMode',
	'codeSimplifier',
	'stripThinkTags',
	'apiKey',
] as const;

const SETTINGS_MIGRATION_KEY = 'openrouter-for-copilot.settingsMigratedFromLegacy.version';
const SETTINGS_MIGRATION_VERSION = 1;

/**
 * One-time copy of user-set `opencode-for-copilot.*` values into
 * `openrouter-for-copilot.*`. The old section is never read again after
 * migration — sibling forks can coexist with independent settings.
 */
export async function migrateLegacySettings(context: vscode.ExtensionContext): Promise<void> {
	if (context.globalState.get<number>(SETTINGS_MIGRATION_KEY, 0) >= SETTINGS_MIGRATION_VERSION) {
		return;
	}
	for (const key of LEGACY_SETTING_KEYS) {
		const next = vscode.workspace.getConfiguration(CONFIG_SECTION).inspect(key);
		if (
			next?.globalValue !== undefined ||
			next?.workspaceValue !== undefined ||
			next?.workspaceFolderValue !== undefined
		) {
			continue;
		}
		const legacy = vscode.workspace.getConfiguration(LEGACY_CONFIG_SECTION).inspect(key);
		if (legacy?.globalValue !== undefined) {
			await vscode.workspace
				.getConfiguration(CONFIG_SECTION)
				.update(key, legacy.globalValue, vscode.ConfigurationTarget.Global);
		}
		if (legacy?.workspaceValue !== undefined) {
			await vscode.workspace
				.getConfiguration(CONFIG_SECTION)
				.update(key, legacy.workspaceValue, vscode.ConfigurationTarget.Workspace);
		}
	}
	await context.globalState.update(SETTINGS_MIGRATION_KEY, SETTINGS_MIGRATION_VERSION);
}

/** OpenRouter uses the OpenAI-compatible wire protocol exclusively. */
export function getApiProtocol(): ApiProtocol {
	return resolveDefaultApiProtocol();
}

export function getApiKeyUrl(): string {
	return OPENROUTER_API_KEY_URL;
}

/**
 * Resolve the API model ID to send to the endpoint.
 *
 * Users can override model IDs via the `modelIdOverrides` setting object
 * (e.g. for third-party API proxies). Falls back to the VS Code model ID
 * when no override is configured.
 */
export function getApiModelId(vscodeModelId: string): string {
	const override = getModelIdOverrides()[vscodeModelId]?.trim();
	return override || vscodeModelId;
}

export function getModelIdOverrides(): Record<string, string> {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
	const raw = config.get<Record<string, unknown>>('modelIdOverrides');
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
		return {};
	}

	return Object.fromEntries(
		Object.entries(raw)
			.map(([key, value]) => [key.trim(), typeof value === 'string' ? value.trim() : ''])
			.filter(([key, value]) => key.length > 0 && value.length > 0),
	);
}

export function getCustomModels(): ModelDefinition[] {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
	const raw = config.get<unknown[]>('customModels', []);
	if (!Array.isArray(raw)) {
		return [];
	}

	const byId = new Map<string, ModelDefinition>();
	for (const entry of raw) {
		const model = normalizeCustomModel(entry);
		if (model) {
			byId.set(model.id, model);
		}
	}
	return [...byId.values()];
}

let dynamicModelsOverride: readonly ModelDefinition[] | undefined;

function buildModelMap(): Map<string, ModelDefinition> {
	const source = dynamicModelsOverride ?? MODELS;
	const byId = new Map(source.map((model) => [model.id, model]));
	for (const model of getCustomModels()) {
		byId.set(model.id, model);
	}
	return byId;
}

export function listProviderModels(): ModelDefinition[] {
	return [...buildModelMap().values()];
}

export async function refreshDynamicModels(): Promise<void> {
	const customModels = getCustomModels();
	const fallback = dynamicModelsOverride ?? MODELS;
	dynamicModelsOverride = await getDynamicModels(customModels, fallback);
}

export function findModelDefinition(modelId: string): ModelDefinition | undefined {
	return buildModelMap().get(modelId);
}

export function getMaxTokens(): number | undefined {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
	const value = config.get<number>('maxTokens', 0);
	return Number.isFinite(value) && value > 0 ? value : undefined;
}

export function getDebugMode(): DebugMode {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
	const mode = getConfiguredDebugMode(config);
	if (mode) return mode;

	return config.get<boolean>('debug', false) ? 'metadata' : 'minimal';
}

export function getDebugLoggingEnabled(): boolean {
	return getDebugMode() !== 'minimal';
}

export function getRequestDumpEnabled(): boolean {
	return getDebugMode() === 'verbose';
}

export function getStabilizeToolListEnabled(): boolean {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
	return config.get<boolean>('experimental.stabilizeToolList', false);
}

export type StripThinkTagsMode = 'auto' | 'always' | 'never';

export function getStripThinkTagsMode(): StripThinkTagsMode {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
	const value = config.get<string>('stripThinkTags', 'auto');
	if (value === 'always' || value === 'never') {
		return value;
	}
	return 'auto';
}

const DEFAULT_PONYTAIL_MODE: PonytailMode = 'full';

export function getPonytailMode(): PonytailMode {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
	const value = config.get<string>('ponytailMode');
	const raw = normalizePonytailMode(value) ?? DEFAULT_PONYTAIL_MODE;
	if (getCodeSimplifierEnabled() && (raw === 'full' || raw === 'ultra')) {
		return 'lite';
	}
	return raw;
}

function normalizePonytailMode(value: unknown): PonytailMode | undefined {
	if (value === 'off' || value === 'lite' || value === 'full' || value === 'ultra') {
		return value;
	}
	return undefined;
}

export function getCodeSimplifierEnabled(): boolean {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
	return config.get<boolean>('codeSimplifier', false);
}

export function getRules(): string[] {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
	const value = config.get<unknown>('rules');
	if (!Array.isArray(value)) {
		return [];
	}
	return value.filter((r): r is string => typeof r === 'string');
}

export function getAllowExtraTools(): boolean {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
	return config.get<boolean>('allowExtraTools', false);
}

export function getAuditFreeModelProbeMs(): number {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
	const raw = config.get<unknown>('auditFreeModelProbeMs', 6_000);
	const n = typeof raw === 'number' && Number.isFinite(raw) ? raw : 6_000;
	return Math.max(500, Math.floor(n));
}

/**
 * Resolve how image attachments reach the selected chat model.
 *
 * `auto` (default): native when the catalog says the model accepts images,
 * otherwise proxy. An explicit `native` / `proxy` / `mcp` setting overrides
 * every model.
 */
export function getModelVisionMode(vscodeModelId: string): ModelVisionMode {
	const configured = vscode.workspace.getConfiguration(CONFIG_SECTION).get<string>('visionMode', 'auto');
	if (configured === 'native' || configured === 'proxy' || configured === 'mcp') {
		return configured;
	}
	return findModelDefinition(vscodeModelId)?.capabilities.imageInput ? 'native' : 'proxy';
}

function getConfiguredDebugMode(config: vscode.WorkspaceConfiguration): DebugMode | undefined {
	const mode = config.inspect<unknown>('debugMode');
	return (
		normalizeDebugMode(mode?.workspaceFolderValue) ??
		normalizeDebugMode(mode?.workspaceValue) ??
		normalizeDebugMode(mode?.globalValue)
	);
}

function normalizeDebugMode(value: unknown): DebugMode | undefined {
	if (value === 'minimal' || value === 'metadata' || value === 'verbose') {
		return value;
	}
	return undefined;
}

function normalizeCustomModel(entry: unknown): ModelDefinition | undefined {
	const model = readCustomModelConfig(entry);
	if (!model) {
		return undefined;
	}

	const id = model.id?.trim();
	if (!id) {
		return undefined;
	}

	const thinking = model.thinking !== false;
	return {
		id,
		name: getCustomModelName(model, id),
		family: 'custom',
		version: 'custom',
		detail: CUSTOM_MODEL_DETAIL,
		maxInputTokens: getPositiveInteger(model.maxInputTokens, CUSTOM_MODEL_MAX_INPUT_TOKENS),
		maxOutputTokens: getPositiveInteger(model.maxOutputTokens, CUSTOM_MODEL_MAX_OUTPUT_TOKENS),
		capabilities: {
			toolCalling: model.toolCalling === false ? false : true,
			imageInput: model.imageInput === true,
			thinking,
		},
		requiresThinkingParam: thinking,
	};
}

function readCustomModelConfig(entry: unknown): CustomModelConfig | undefined {
	if (typeof entry === 'string') {
		return { id: entry };
	}

	if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
		return undefined;
	}

	return entry as CustomModelConfig;
}

function getCustomModelName(model: CustomModelConfig, id: string): string {
	const name = model.name?.trim();
	return name || id;
}

function getPositiveInteger(value: unknown, fallback: number): number {
	return typeof value === 'number' && Number.isFinite(value) && value > 0
		? Math.floor(value)
		: fallback;
}
