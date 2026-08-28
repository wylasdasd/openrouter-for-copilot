import vscode from 'vscode';
import {
	API_KEY_SECRET,
	CONFIG_SECTION,
	LEGACY_API_KEY_SECRETS,
} from './consts';
import { t } from './i18n';

const SECRETS_MIGRATION_KEY = 'openrouter-for-copilot.secretsMigratedFromLegacy.version';
const SECRETS_MIGRATION_VERSION = 1;

/**
 * Manages API key via VS Code SecretStorage (secure) with
 * fallback to extension settings (less secure, for CI/automation).
 */
export class AuthManager {
	private readonly secretStorage: vscode.SecretStorage;
	private readonly globalState: vscode.Memento;

	constructor(context: vscode.ExtensionContext) {
		this.secretStorage = context.secrets;
		this.globalState = context.globalState;
	}

	/**
	 * One-time copy of a legacy sibling-fork API key into this extension's
	 * SecretStorage slot. Legacy keys are never read again after migration.
	 */
	async migrateLegacySecrets(): Promise<void> {
		if (this.globalState.get<number>(SECRETS_MIGRATION_KEY, 0) >= SECRETS_MIGRATION_VERSION) {
			return;
		}
		const current = await this.secretStorage.get(API_KEY_SECRET);
		if (!current?.trim()) {
			for (const legacyKey of LEGACY_API_KEY_SECRETS) {
				const legacy = await this.secretStorage.get(legacyKey);
				if (legacy?.trim()) {
					await this.secretStorage.store(API_KEY_SECRET, legacy.trim());
					break;
				}
			}
		}
		await this.globalState.update(SECRETS_MIGRATION_KEY, SECRETS_MIGRATION_VERSION);
	}

	/**
	 * Get API key. Tries SecretStorage first, then falls back to settings.
	 */
	async getApiKey(): Promise<string | undefined> {
		const secretKey = await this.secretStorage.get(API_KEY_SECRET);
		if (secretKey?.trim()) {
			return secretKey.trim();
		}

		const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
		const settingsKey = config.get<string>('apiKey');
		if (settingsKey?.trim()) {
			return settingsKey.trim();
		}

		return undefined;
	}

	/**
	 * Store API key in SecretStorage.
	 */
	async setApiKey(apiKey: string): Promise<void> {
		await this.secretStorage.store(API_KEY_SECRET, apiKey.trim());
	}

	/**
	 * Delete stored API key.
	 */
	async deleteApiKey(): Promise<void> {
		await this.secretStorage.delete(API_KEY_SECRET);
		await clearSettingsApiKey();
	}

	/** Remove the stored API key and the settings fallback. */
	async deleteAllApiKeys(): Promise<void> {
		await this.deleteApiKey();
	}

	/**
	 * Check if an API key is configured.
	 */
	async hasApiKey(): Promise<boolean> {
		const key = await this.getApiKey();
		return key !== undefined && key.length > 0;
	}

	/**
	 * Prompt user to enter an API key via input box.
	 */
	async promptForApiKey(): Promise<boolean> {
		const apiKey = await vscode.window.showInputBox({
			prompt: t('auth.prompt'),
			placeHolder: t('auth.placeholder'),
			password: true,
			ignoreFocusOut: true,
			validateInput: (value: string) => {
				if (!value?.trim()) {
					return t('auth.emptyValidation');
				}
				return undefined;
			},
		});

		if (apiKey) {
			await this.setApiKey(apiKey);
			vscode.window.showInformationMessage(t('auth.saved'));
			return true;
		}

		return false;
	}
}

async function clearSettingsApiKey(): Promise<void> {
	await clearSettingsApiKeyAtScope(vscode.ConfigurationTarget.Global);

	if (vscode.workspace.workspaceFile || vscode.workspace.workspaceFolders?.length) {
		await clearSettingsApiKeyAtScope(vscode.ConfigurationTarget.Workspace);
	}

	for (const folder of vscode.workspace.workspaceFolders ?? []) {
		await clearSettingsApiKeyAtScope(vscode.ConfigurationTarget.WorkspaceFolder, folder.uri);
	}
}

async function clearSettingsApiKeyAtScope(
	target: vscode.ConfigurationTarget,
	resource?: vscode.Uri,
): Promise<void> {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION, resource);
	const inspection = config.inspect<string>('apiKey');
	if (!hasScopedApiKey(inspection, target)) {
		return;
	}
	await config.update('apiKey', undefined, target);
}

function hasScopedApiKey(
	inspection:
		| {
				globalValue?: string;
				workspaceValue?: string;
				workspaceFolderValue?: string;
		  }
		| undefined,
	target: vscode.ConfigurationTarget,
): boolean {
	if (!inspection) {
		return false;
	}
	if (target === vscode.ConfigurationTarget.Global) {
		return typeof inspection.globalValue === 'string';
	}
	if (target === vscode.ConfigurationTarget.Workspace) {
		return typeof inspection.workspaceValue === 'string';
	}
	return typeof inspection.workspaceFolderValue === 'string';
}
