import vscode from 'vscode';
import { CONFIG_SECTION, MODEL_VENDOR } from '../consts';
import { logger } from '../logger';
import { GLMChatProvider } from '../provider';
import type { PonytailMode } from '../provider/ponytail';

export async function registerProvider(context: vscode.ExtensionContext): Promise<GLMChatProvider> {
	const provider = new GLMChatProvider(context);

	context.subscriptions.push(
		vscode.commands.registerCommand('openrouter-for-copilot.setApiKey', () => provider.configureApiKey()),
		vscode.commands.registerCommand('openrouter-for-copilot.refreshModels', () => provider.refreshModels()),
		vscode.commands.registerCommand('openrouter-for-copilot.queryUsage', () => provider.queryUsage()),
		vscode.commands.registerCommand('openrouter-for-copilot.clearApiKey', () => provider.clearApiKey()),
		vscode.commands.registerCommand('openrouter-for-copilot.setVisionModel', () => provider.setVisionModel()),
		vscode.commands.registerCommand('openrouter-for-copilot.setPonytailMode', () => setPonytailModeCommand()),
		vscode.commands.registerCommand('openrouter-for-copilot.toggleCodeSimplifier', () => toggleCodeSimplifierCommand()),
		vscode.lm.registerLanguageModelChatProvider(MODEL_VENDOR, provider),
	);

	provider.startCatalogRefresh();

	// Cold start: Copilot Chat often builds Other models before this
	// extension's change event has a listener. Disable/enable works because
	// it re-registers the provider while Copilot is already listening.
	await activateCopilotChat();
	schedulePickerNudges(context, provider);

	return provider;
}

async function setPonytailModeCommand(): Promise<void> {
	const modes: { label: string; mode: PonytailMode; description: string }[] = [
		{ label: 'Off', mode: 'off', description: 'No extra instruction' },
		{ label: 'Lite', mode: 'lite', description: 'Gentle reuse reminder' },
		{ label: 'Full', mode: 'full', description: 'Full Ponytail ladder (default)' },
		{ label: 'Ultra', mode: 'ultra', description: 'Aggressive minimalism' },
	];

	const current = vscode.workspace.getConfiguration(CONFIG_SECTION).get<string>('ponytailMode');
	const picked = await vscode.window.showQuickPick(
		modes.map((m) => ({
			...m,
			picked: m.mode === current,
		})),
		{ placeHolder: 'Select Ponytail verification intensity' },
	);
	if (!picked) {
		return;
	}

	await vscode.workspace
		.getConfiguration(CONFIG_SECTION)
		.update('ponytailMode', picked.mode, vscode.ConfigurationTarget.Global);
	void vscode.window.showInformationMessage(`Ponytail mode set to ${picked.label}.`);
}

async function toggleCodeSimplifierCommand(): Promise<void> {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
	const current = config.get<boolean>('codeSimplifier', false);
	const next = !current;

	const answer = await vscode.window.showInformationMessage(
		next
			? 'Enable Code Simplifier? Ponytail will be lowered to Lite for compatibility.'
			: 'Disable Code Simplifier? Ponytail will return to its configured level.',
		{ modal: true },
		next ? 'Enable' : 'Disable',
	);
	if (!answer) {
		return;
	}

	await config.update('codeSimplifier', next, vscode.ConfigurationTarget.Global);
	void vscode.window.showInformationMessage(
		`Code Simplifier ${next ? 'enabled' : 'disabled'}.`,
	);
}

async function activateCopilotChat(): Promise<void> {
	try {
		await vscode.extensions.getExtension('github.copilot-chat')?.activate();
	} catch (error) {
		logger.warn('Copilot Chat activation unavailable; model picker refresh may be delayed', error);
	}
}

/** Push our catalog into Copilot Chat: fire the change event, then force a pull. */
async function nudgeCopilotModelPicker(provider: GLMChatProvider): Promise<void> {
	provider.refreshModelPicker();
	try {
		await vscode.lm.selectChatModels({ vendor: MODEL_VENDOR });
	} catch (error) {
		logger.warn('Failed to nudge Copilot Chat model picker', error);
	}
}

function schedulePickerNudges(context: vscode.ExtensionContext, provider: GLMChatProvider): void {
	// Immediate + delayed: Copilot Chat may subscribe after our first fire.
	for (const delayMs of [0, 1_000, 4_000]) {
		const handle = setTimeout(() => {
			void nudgeCopilotModelPicker(provider);
		}, delayMs);
		context.subscriptions.push({ dispose: () => clearTimeout(handle) });
	}

	const copilot = vscode.extensions.getExtension('github.copilot-chat');
	if (copilot && !copilot.isActive) {
		const sub = vscode.extensions.onDidChange(() => {
			if (vscode.extensions.getExtension('github.copilot-chat')?.isActive) {
				void nudgeCopilotModelPicker(provider);
				sub.dispose();
			}
		});
		context.subscriptions.push(sub);
	}
}
