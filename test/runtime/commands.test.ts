import { beforeEach, describe, expect, it } from 'vitest';
import * as vscode from 'vscode';
import { OPENROUTER_API_KEY_URL } from '../../src/endpoint';
import { registerCommands } from '../../src/runtime/commands';
import {
	__clearConfigurationValues,
	__getOpenedExternal,
	__resetCommandState,
} from '../support/vscode.mock';

describe('runtime commands', () => {
	beforeEach(() => {
		__clearConfigurationValues();
		__resetCommandState();
	});

	it('opens the OpenRouter API key page', async () => {
		registerCommands({ subscriptions: [] } as unknown as vscode.ExtensionContext);

		await vscode.commands.executeCommand('openrouter-for-copilot.getApiKey');

		expect(__getOpenedExternal()?.toString()).toBe(OPENROUTER_API_KEY_URL);
	});
});
