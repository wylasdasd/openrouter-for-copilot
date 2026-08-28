#!/usr/bin/env node
/**
 * Install the latest dist/openrouter-for-copilot-*.vsix via `code --install-extension`.
 *
 * Suppresses Node DEP0169 (`url.parse` deprecation) emitted by the VS Code CLI on
 * Node 24 — not by this extension. See scripts/install-vsix.mjs + README.
 */
import { spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'dist');

function mergeNodeOptions(existing, flag) {
	if (!existing?.trim()) {
		return flag;
	}
	return existing.includes(flag) ? existing : `${existing} ${flag}`;
}

function findLatestVsix() {
	let latest;
	for (const name of readdirSync(distDir)) {
		if (!name.endsWith('.vsix') || !name.startsWith('openrouter-for-copilot-')) {
			continue;
		}
		const fullPath = join(distDir, name);
		const mtime = statSync(fullPath).mtimeMs;
		if (!latest || mtime > latest.mtime) {
			latest = { name, fullPath, mtime };
		}
	}
	return latest?.fullPath;
}

const vsixPath = findLatestVsix();
if (!vsixPath) {
	console.error('No dist/openrouter-for-copilot-*.vsix found. Run: pnpm package');
	process.exit(1);
}

const env = {
	...process.env,
	NODE_OPTIONS: mergeNodeOptions(process.env.NODE_OPTIONS, '--disable-warning=DEP0169'),
};

console.log(`Installing ${vsixPath} ...`);
const result = spawnSync('code', ['--install-extension', vsixPath], {
	env,
	stdio: 'inherit',
	shell: process.platform === 'win32',
});

process.exit(result.status ?? (result.error ? 1 : 0));
