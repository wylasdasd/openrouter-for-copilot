import { beforeEach, describe, expect, it } from 'vitest';
import * as vscode from 'vscode';
import {
	findModelDefinition,
	getApiKeyUrl,
	getApiModelId,
	getApiProtocol,
	getBaseUrl,
	getCustomModels,
	listProviderModels,
	migrateLegacySettings,
} from '../src/config';
import { MODELS } from '../src/consts';
import {
	OPENROUTER_API_KEY_URL,
	OPENROUTER_BASE_URL,
} from '../src/endpoint';
import { __clearConfigurationValues, __setConfigurationValue } from './support/vscode.mock';

describe('legacy settings migration (opencode-for-copilot -> openrouter-for-copilot)', () => {
	beforeEach(() => {
		__clearConfigurationValues();
	});

	it('copies user-set legacy values to the new section exactly once', async () => {
		__setConfigurationValue('opencode-for-copilot.maxTokens', 8192);
		const store = new Map<string, unknown>();
		const context = {
			globalState: {
				get: (_key: string) => undefined,
				update: (key: string, value: unknown) => Promise.resolve(store.set(key, value)),
			},
		} as unknown as vscode.ExtensionContext;

		await migrateLegacySettings(context);

		expect(getBaseUrl()).toBe(OPENROUTER_BASE_URL);
		expect(vscode.workspace.getConfiguration('openrouter-for-copilot').get('maxTokens')).toBe(8192);
	});
});

describe('configuration helpers', () => {
	beforeEach(() => {
		__clearConfigurationValues();
	});

	it('defaults to the OpenRouter endpoint when nothing is configured', () => {
		expect(getBaseUrl()).toBe(OPENROUTER_BASE_URL);
		expect(getApiKeyUrl()).toBe(OPENROUTER_API_KEY_URL);
		expect(getApiProtocol()).toBe('openai');
	});

	it('lets non-empty baseUrl override the default', () => {
		__setConfigurationValue('openrouter-for-copilot.baseUrl', 'https://proxy.example.com/v1');

		expect(getBaseUrl()).toBe('https://proxy.example.com/v1');
	});

	it('normalizes custom model strings and objects', () => {
		__setConfigurationValue('openrouter-for-copilot.customModels', [
			' team-coder ',
			{
				id: ' custom-no-tools ',
				name: ' Custom No Tools ',
				maxInputTokens: 123.9,
				maxOutputTokens: 456,
				toolCalling: false,
				thinking: false,
			},
			{ id: '   ' },
			123,
		]);

		const models = getCustomModels();

		expect(models).toHaveLength(2);
		expect(models[0]).toMatchObject({
			id: 'team-coder',
			name: 'team-coder',
			maxInputTokens: 200_000,
			maxOutputTokens: 131_072,
			capabilities: {
				toolCalling: true,
				imageInput: false,
				thinking: true,
			},
			requiresThinkingParam: true,
		});
		expect(models[1]).toMatchObject({
			id: 'custom-no-tools',
			name: 'Custom No Tools',
			maxInputTokens: 123,
			maxOutputTokens: 456,
			capabilities: {
				toolCalling: false,
				imageInput: false,
				thinking: false,
			},
			requiresThinkingParam: false,
		});
	});

	it('lets custom model IDs override built-in model lookup and picker registry', () => {
		__setConfigurationValue('openrouter-for-copilot.customModels', [
			{
				id: 'deepseek/deepseek-chat',
				name: 'Local DeepSeek Chat',
				maxInputTokens: 42,
				thinking: false,
			},
		]);

		const models = listProviderModels();

		expect(models).toHaveLength(MODELS.length);
		expect(findModelDefinition('deepseek/deepseek-chat')).toMatchObject({
			id: 'deepseek/deepseek-chat',
			name: 'Local DeepSeek Chat',
			maxInputTokens: 42,
			capabilities: {
				imageInput: false,
				thinking: false,
			},
		});
	});

	it('supports modelIdOverrides for arbitrary built-in or custom model IDs', () => {
		__setConfigurationValue('openrouter-for-copilot.modelIdOverrides', {
			'deepseek/deepseek-chat': 'deepseek/deepseek-v3',
			'team-coder': 'provider-team-coder',
			empty: '   ',
		});

		expect(getApiModelId('deepseek/deepseek-chat')).toBe('deepseek/deepseek-v3');
		expect(getApiModelId('team-coder')).toBe('provider-team-coder');
		expect(getApiModelId('empty')).toBe('empty');
		expect(getApiModelId('unknown')).toBe('unknown');
	});
});
