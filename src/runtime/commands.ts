import vscode from 'vscode';
import { getApiKeyUrl } from '../config';
import { t } from '../i18n';
import { logger } from '../logger';
import { ensureRequestDumpRoot } from '../provider/debug';
import { cleanupAllStoredImages } from '../provider/vision/image-store';
import { buildRuntimeDiagnosticsReport } from './diagnostics';

export function registerCommands(context: vscode.ExtensionContext): void {
	context.subscriptions.push(
		vscode.commands.registerCommand('openrouter-for-copilot.showLogs', () => logger.show()),
		vscode.commands.registerCommand('openrouter-for-copilot.showDiagnostics', () =>
			showRuntimeDiagnostics(context),
		),
		vscode.commands.registerCommand('openrouter-for-copilot.openRequestDumpsFolder', () =>
			openRequestDumpsFolder(context),
		),
		vscode.commands.registerCommand('openrouter-for-copilot.getApiKey', () =>
			vscode.env.openExternal(vscode.Uri.parse(getApiKeyUrl())),
		),
		vscode.commands.registerCommand('openrouter-for-copilot.openSettings', () =>
			vscode.commands.executeCommand('workbench.action.openSettings', 'openrouter-for-copilot'),
		),
		vscode.commands.registerCommand('openrouter-for-copilot.cleanupStoredImages', cleanupStoredImages),
	);
}

async function openRequestDumpsFolder(context: vscode.ExtensionContext): Promise<void> {
	try {
		const root = await ensureRequestDumpRoot(context.globalStorageUri);
		logger.info(`Opening request dumps folder: ${root.toString(true)}`);
		await vscode.commands.executeCommand('revealFileInOS', root);
	} catch (error) {
		logger.warn('Failed to open request dumps folder', error);
		void vscode.window.showErrorMessage(t('extension.openRequestDumpsFolderFailed'));
	}
}

async function cleanupStoredImages(): Promise<void> {
	const confirm = await vscode.window.showWarningMessage(
		t('command.cleanupStoredImages.confirm'),
		{ modal: true },
		t('command.cleanupStoredImages.confirmYes'),
	);
	if (confirm !== t('command.cleanupStoredImages.confirmYes')) {
		return;
	}
	try {
		const deleted = await cleanupAllStoredImages();
		void vscode.window.showInformationMessage(t('command.cleanupStoredImages.done', deleted));
	} catch (error) {
		logger.warn('Failed to clean up stored images', error);
		void vscode.window.showErrorMessage(t('command.cleanupStoredImages.failed'));
	}
}

/** Open the runtime-diagnostics report as an untitled markdown document. */
async function showRuntimeDiagnostics(context: vscode.ExtensionContext): Promise<void> {
	const doc = await vscode.workspace.openTextDocument({
		language: 'markdown',
		content: buildRuntimeDiagnosticsReport(context),
	});
	await vscode.window.showTextDocument(doc, { preview: true });
}
