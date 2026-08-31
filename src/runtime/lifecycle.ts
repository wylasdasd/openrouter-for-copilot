import vscode from 'vscode';
import { migrateLegacySettings } from '../config';
import { t } from '../i18n';
import { logger } from '../logger';
import { GLMChatProvider } from '../provider';
import { AuthManager } from '../auth';
import { registerActionUrls } from './actions';
import { seedChatLanguageModelDefaults } from './chat-language-models';
import { registerCommands } from './commands';
import { initializeDiagnostics } from './diagnostics';
import { registerAgentPipeline } from './agent-pipeline';
import { registerProvider } from './provider';
import { showWelcomeIfNeeded } from './welcome';
import { initImageStore } from '../provider/vision/image-store';

let activeProvider: GLMChatProvider | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	await migrateLegacySettings(context);
	const authManager = new AuthManager(context);
	await authManager.migrateLegacySecrets();
	await initializeDiagnostics(context);
	await seedChatLanguageModelDefaults(context);
	await initImageStore(context.globalStorageUri);
	registerCommands(context);
	registerActionUrls(context);
	registerAgentPipeline(context);

	try {
		const provider = await registerProvider(context);
		activeProvider = provider;

		void showWelcomeIfNeeded(context, provider).catch((error) => {
			logger.warn(t('extension.welcomeFailed'), error);
		});

		logger.info(`Extension activated version=${context.extension.packageJSON.version}`);
	} catch (error) {
		activeProvider = undefined;
		logger.error('Failed to activate OpenRouter extension', error);
		void vscode.window.showErrorMessage(t('extension.activateFailed'));
		throw error;
	}
}

export async function deactivate(): Promise<void> {
	try {
		// Leave the last catalog in Copilot Chat. Reporting [] on unload persists
		// across restarts and wipes Other models until the VSIX is reinstalled.
		logger.info('Extension deactivated');
	} catch (error) {
		logger.warn(t('extension.deactivateFailed'), error);
	} finally {
		activeProvider = undefined;
		logger.dispose();
	}
}
