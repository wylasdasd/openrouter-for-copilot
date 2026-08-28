import { dirname, join } from 'path';
import vscode from 'vscode';
import { MODELS, MODEL_VENDOR } from '../consts';
import { logger } from '../logger';

const CHAT_LANGUAGE_MODELS_MIGRATION_KEY =
	'openrouter-for-copilot.chatLanguageModels.defaultReasoningEffort.version';
// v1: seed defaults under the colliding `openrouter` vendor (Copilot built-in).
// v2: seed defaults under `openrouter-for-copilot` after the vendor rename.
const CHAT_LANGUAGE_MODELS_MIGRATION_VERSION = 2;
const DEFAULT_REASONING_EFFORT = 'max';

interface ChatLanguageModelGroup {
	name?: unknown;
	vendor?: unknown;
	settings?: Record<string, unknown>;
}

interface ChatLanguageModelSetting {
	reasoningEffort?: unknown;
	[key: string]: unknown;
}

export async function seedChatLanguageModelDefaults(
	context: vscode.ExtensionContext,
): Promise<void> {
	const migratedVersion = context.globalState.get<number>(CHAT_LANGUAGE_MODELS_MIGRATION_KEY, 0);
	if (migratedVersion >= CHAT_LANGUAGE_MODELS_MIGRATION_VERSION) {
		return;
	}

	const filePath = getChatLanguageModelsPath(context);
	if (!filePath) {
		logger.warn('Unable to locate chatLanguageModels.json for OpenRouter defaults migration');
		// Mark migration as complete even when the file is unreachable (e.g.
		// remote VS Code sessions) so we don't retry forever on every activation.
		await context.globalState.update(
			CHAT_LANGUAGE_MODELS_MIGRATION_KEY,
			CHAT_LANGUAGE_MODELS_MIGRATION_VERSION,
		);
		return;
	}

	try {
		const changed = await upsertVendorDefaults(filePath);
		await context.globalState.update(
			CHAT_LANGUAGE_MODELS_MIGRATION_KEY,
			CHAT_LANGUAGE_MODELS_MIGRATION_VERSION,
		);
		if (changed) {
			logger.info(
				`Seeded OpenRouter chat model defaults: file=${filePath} reasoningEffort=${DEFAULT_REASONING_EFFORT}`,
			);
		}
	} catch (error) {
		logger.warn(`Failed to seed OpenRouter chat model defaults: file=${filePath}`, error);
	}
}

function getChatLanguageModelsPath(context: vscode.ExtensionContext): string | undefined {
	if (context.globalStorageUri.scheme !== 'file') {
		return undefined;
	}

	const globalStorageDir = dirname(context.globalStorageUri.fsPath);
	const userDataDir = dirname(globalStorageDir);
	return join(userDataDir, 'chatLanguageModels.json');
}

async function upsertVendorDefaults(filePath: string): Promise<boolean> {
	const raw = await readExistingChatLanguageModels(filePath);
	const parsed: unknown = raw ? JSON.parse(raw) : [];
	if (!Array.isArray(parsed)) {
		throw new Error('chatLanguageModels.json must contain an array');
	}

	const groups = parsed as ChatLanguageModelGroup[];
	const vendorGroup = getOrCreateVendorGroup(groups);
	const settings = getOrCreateSettings(vendorGroup);
	let changed = false;

	// Fix group name if missing — this mutation must also be persisted.
	if (vendorGroup.name === undefined) {
		vendorGroup.name = 'OpenRouter';
		changed = true;
	}

	for (const model of MODELS) {
		if (!model.capabilities.thinking) {
			continue;
		}

		const current = settings[model.id];
		if (!current || typeof current !== 'object' || Array.isArray(current)) {
			settings[model.id] = { reasoningEffort: DEFAULT_REASONING_EFFORT };
			changed = true;
			continue;
		}

		const setting = current as ChatLanguageModelSetting;
		if (setting.reasoningEffort === undefined || setting.reasoningEffort === 'high') {
			setting.reasoningEffort = DEFAULT_REASONING_EFFORT;
			changed = true;
		}
	}

	if (!changed) {
		return false;
	}

	await vscode.workspace.fs.createDirectory(vscode.Uri.file(dirname(filePath)));
	await vscode.workspace.fs.writeFile(
		vscode.Uri.file(filePath),
		new TextEncoder().encode(`${JSON.stringify(groups, null, 4)}\n`),
	);
	return true;
}

async function readExistingChatLanguageModels(filePath: string): Promise<string | undefined> {
	try {
		const content = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
		return new TextDecoder().decode(content);
	} catch (error) {
		if (isFileNotFoundError(error)) {
			return undefined;
		}
		throw error;
	}
}

function getOrCreateVendorGroup(groups: ChatLanguageModelGroup[]): ChatLanguageModelGroup {
	const existing = groups.find((group) => group.vendor === MODEL_VENDOR);
	if (existing) {
		return existing;
	}

	const created: ChatLanguageModelGroup = {
		name: 'OpenRouter',
		vendor: MODEL_VENDOR,
		settings: {},
	};
	groups.push(created);
	return created;
}

function getOrCreateSettings(group: ChatLanguageModelGroup): Record<string, unknown> {
	if (!group.settings || typeof group.settings !== 'object' || Array.isArray(group.settings)) {
		group.settings = {};
	}
	return group.settings;
}

function isFileNotFoundError(error: unknown): boolean {
	if (!error || typeof error !== 'object') {
		return false;
	}
	const code = (error as { code?: unknown }).code;
	return code === 'FileNotFound' || code === 'ENOENT';
}
