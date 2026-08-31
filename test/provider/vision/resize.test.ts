import { beforeEach, describe, expect, it } from 'vitest';
import * as vscode from 'vscode';
import { resizeImage } from '../../../src/provider/vision/shared/resize';
import { __resetCommandState } from '../../support/vscode.mock';

const token = {
	isCancellationRequested: false,
	onCancellationRequested: () => ({ dispose() {} }),
} as vscode.CancellationToken;

describe('resizeImage', () => {
	beforeEach(() => {
		__resetCommandState();
	});

	it('rethrows CancellationError from _chat.resizeImage', async () => {
		vscode.commands.registerCommand('_chat.resizeImage', () => {
			throw new vscode.CancellationError();
		});

		await expect(resizeImage(new Uint8Array([1, 2, 3]), 'image/png', token)).rejects.toBeInstanceOf(
			vscode.CancellationError,
		);
	});
});
