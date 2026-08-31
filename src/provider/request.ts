import vscode from 'vscode';
import { AuthManager } from '../auth';
import { GLMClient } from '../client';
import {
	findModelDefinition,
	getApiModelId,
	getApiProtocol,
	getBaseUrl,
	getCodeSimplifierEnabled,
	getMaxTokens,
	getModelVisionMode,
	getPonytailMode,
	getRules,
} from '../config';
import { t } from '../i18n';
import { getGLMContentText } from '../glm-content';
import { CONFIG_SECTION } from '../consts';
import type { ApiProtocol, GLMMessage, GLMRequest, ModelDefinition, ModelVisionMode, PricingCurrency } from '../types';
import { injectCodeSimplifierSystemMessage } from './code-simplifier';
import { convertMessages, countMessageChars } from './convert';
import { dumpGLMRequest, type CacheDiagnosticsRecorder, type CacheDiagnosticsRun } from './debug';
import { getConfiguredThinkingEffort, type ModelConfigurationOptions } from './models';
import { injectPonytailSystemMessage } from './ponytail';
import { getPricingCurrencyForBaseUrl } from './pricing/currency';
import type { ReplayMarkerMetadata } from './replay';
import { resolveRequestMaxTokens, shouldForceThinkingNone, type RequestKind } from './routing';
import { injectRulesSystemMessage } from './rules';
import type { ConversationSegment } from './segment';
import { REQUEST_KINDS_ELIGIBLE_FOR_TOOL_TRIMMING } from './tools/consts';
import { collectTrailingToolResultIds, prepareRequestTools } from './tools/request';
import { resolveImageMessages, type VisionDescriber } from './vision';
import {
	hasImageCapableTool,
	readImageCapableToolOverrides,
	stripImageCapableToolsFromOptions,
} from './vision/image-capable-tools';
import { createVisionProxyFallbackNotice } from './tools/notices';

// ---- GLMClient instance cache ----
// Reuse client objects by `${baseUrl}:${protocol}` to avoid per-request GC
// pressure and enable connection reuse via Node's fetch pool.
const clientCache = new Map<string, GLMClient>();

function getCachedClient(baseUrl: string, apiKey: string, protocol: ApiProtocol): GLMClient {
	const key = `${baseUrl}:${apiKey}:${protocol}`;
	let client = clientCache.get(key);
	if (client) {
		return client;
	}
	client = new GLMClient(baseUrl, apiKey, protocol);
	clientCache.set(key, client);
	return client;
}

/**
 * Clear cached GLMClient instances. Call when configuration changes
 * (base URL, API key, or protocol) to ensure stale clients are discarded.
 */
export function clearClientCache(): void {
	clientCache.clear();
}

export interface PreparedChatRequest {
	client: GLMClient;
	request: GLMRequest;
	isThinkingModel: boolean;
	totalRequestChars: number;
	trailingToolResultIds: string[];
	cacheDiagnostics: CacheDiagnosticsRun;
	requestKind: RequestKind;
	segment: ConversationSegment;
	replayMarkerMetadata: ReplayMarkerMetadata;
	modelDefinition?: ModelDefinition;
	pricingCurrency?: PricingCurrency;
	visionMarkerTextChars?: number;
	initialResponseNotice?: string;
	visionMode: ModelVisionMode;
	nativeImageParts: number;
	nativeImageBytes: number;
}

export interface PrepareChatRequestOptions {
	authManager: AuthManager;
	globalStorageUri: vscode.Uri;
	modelInfo: vscode.LanguageModelChatInformation;
	segment: ConversationSegment;
	messages: readonly vscode.LanguageModelChatRequestMessage[];
	options: vscode.ProvideLanguageModelChatResponseOptions;
	token: vscode.CancellationToken;
	cacheDiagnostics: CacheDiagnosticsRecorder;
	getVisionDescriber: () => Promise<VisionDescriber | undefined>;
	requestKind: RequestKind;
}

export async function prepareChatRequest({
	authManager,
	globalStorageUri,
	modelInfo,
	segment,
	messages,
	options,
	token,
	cacheDiagnostics,
	getVisionDescriber,
	requestKind,
}: PrepareChatRequestOptions): Promise<PreparedChatRequest> {
	const modelDef = findModelDefinition(modelInfo.id);
	const baseUrl = getBaseUrl();
	const apiProtocol = getApiProtocol();
	const apiKey = await authManager.getApiKey();
	if (!apiKey) {
		throw new Error(t('auth.notConfigured'));
	}
	const client = getCachedClient(baseUrl, apiKey, apiProtocol);
	const isThinkingModel = modelDef?.capabilities.thinking ?? false;
	const maxTokens = resolveRequestMaxTokens(requestKind, getMaxTokens());
	const apiModelId = getApiModelId(modelInfo.id);
	const visionMode = getModelVisionMode(modelInfo.id);
	const imageCapableOverrides = readImageCapableToolOverrides();
	const imageCount = messages.reduce(
		(count, message) =>
			count +
			(message.content as readonly vscode.LanguageModelInputPart[]).filter(
				(p) => p instanceof vscode.LanguageModelDataPart && p.mimeType.startsWith('image/'),
			).length,
		0,
	);

	let tools = prepareRequestTools(
		modelDef?.capabilities.toolCalling,
		options,
		modelDef?.capabilities.preferredToolLimit,
		requestKind,
	);

	let effectiveVisionMode = visionMode;
	let mcpFallbackNotice: string | undefined;
	if (visionMode === 'mcp' && imageCount > 0) {
		const toolCallingOff = !tools || tools.length === 0;
		const hasVisionTool =
			!toolCallingOff && hasImageCapableTool(options, imageCapableOverrides, imageCount);
		if (!hasVisionTool) {
			if (toolCallingOff) {
				throw new Error(t('vision.mcp.conflict.toolCallingDisabled'));
			}
			const proxyDescriber = await getVisionDescriber();
			if (proxyDescriber) {
				effectiveVisionMode = 'proxy';
				mcpFallbackNotice = createVisionProxyFallbackNotice();
			} else {
				throw new Error(t('vision.mcp.conflict.noImageTool'));
			}
		}
	}

	const shouldStripImageTools = effectiveVisionMode !== 'mcp' && imageCount > 0;
	const requestOptions = shouldStripImageTools
		? stripImageCapableToolsFromOptions(options, imageCapableOverrides)
		: options;
	if (shouldStripImageTools) {
		tools = prepareRequestTools(
			modelDef?.capabilities.toolCalling,
			requestOptions,
			modelDef?.capabilities.preferredToolLimit,
			requestKind,
		);
	}

	const visionResolution = await resolveImageMessages(
		messages,
		token,
		getVisionDescriber,
		effectiveVisionMode,
	);
	const resolvedMessages = visionResolution.messages;
	const glmMessages = convertMessages(resolvedMessages, isThinkingModel, modelDef?.id);
	if (effectiveVisionMode === 'mcp') {
		injectImageToolGuidance(glmMessages);
	}

	const ponytailMode = getPonytailMode();
	// Coding-discipline instructions only help real coding requests (main-agent,
	// background). Injecting them into utility calls (chat-title, git-commit,
	// rename, classifiers) wastes tokens, pollutes the prompt cache, and adds
	// off-task noise — so gate on the same set tool-trimming already uses.
	const isCodingRequest = REQUEST_KINDS_ELIGIBLE_FOR_TOOL_TRIMMING.has(requestKind);
	let glmMessagesWithPonytail = isCodingRequest
		? injectRulesSystemMessage(glmMessages, getRules())
		: glmMessages;
	glmMessagesWithPonytail = isCodingRequest
		? injectPonytailSystemMessage(glmMessagesWithPonytail, ponytailMode)
		: glmMessagesWithPonytail;

	// Code Simplifier runs on top of (downgraded) Ponytail for clean, refined output.
	if (isCodingRequest && getCodeSimplifierEnabled()) {
		glmMessagesWithPonytail = injectCodeSimplifierSystemMessage(glmMessagesWithPonytail);
	}

	const totalRequestChars = countMessageChars(glmMessagesWithPonytail, tools);
	const baseRequest: GLMRequest = {
		model: apiModelId,
		messages: glmMessagesWithPonytail,
		stream: true,
		stream_options: { include_usage: true },
		tools,
		tool_choice: tools && tools.length > 0 ? ('auto' as const) : undefined,
		max_tokens: maxTokens,
	};
	const configuredThinkingEffort = getConfiguredThinkingEffort(
		options as ModelConfigurationOptions,
	);
	const thinkingEffort = shouldForceThinkingNone(requestKind)
		? 'none'
		: configuredThinkingEffort;
	const supportsReasoningEffort = modelDef?.supportsReasoningEffort ?? false;
	const request: GLMRequest = {
		...baseRequest,
		...(isThinkingModel
			? {
					thinking: {
						type: thinkingEffort === 'none' ? ('disabled' as const) : ('enabled' as const),
						...(thinkingEffort === 'none' ? {} : { clear_thinking: false }),
					},
					...(thinkingEffort !== 'none' && supportsReasoningEffort
						? { reasoning_effort: thinkingEffort }
						: {}),
				}
			: {}),
	};
	dumpGLMRequest(request, {
		globalStorageUri,
		segment,
		requestKind,
		vscodeModelId: modelInfo.id,
		isThinkingModel,
		thinkingEffort,
		maxTokens,
		inputMessages: messages,
		resolvedMessages,
		requestOptions,
		visionModelId: visionResolution.visionModelId,
		visionProxySource: visionResolution.visionProxySource,
		visionStats: visionResolution.stats,
		visionMode: effectiveVisionMode,
	});

	// Guard: skip heavy diagnostics options construction when debug logging
	// is disabled. beginRequest() already returns a noop, but this avoids
	// building the BeginCacheDiagnosticsOptions object with full message arrays.
	const diagnosticsRun = cacheDiagnostics.isEnabled()
		? cacheDiagnostics.beginRequest({
				request,
				segment,
				requestKind,
				vscodeModelId: modelInfo.id,
				isThinkingModel,
				thinkingEffort,
				maxTokens,
				inputMessages: messages,
				resolvedMessages,
				visionModelId: visionResolution.visionModelId,
				visionProxySource: visionResolution.visionProxySource,
				visionStats: visionResolution.stats,
				visionMode: effectiveVisionMode,
				ponytailMode,
			})
		: createNoopCacheDiagnosticsRun();

	return {
		client,
		request,
		isThinkingModel,
		totalRequestChars,
		trailingToolResultIds: collectTrailingToolResultIds(glmMessagesWithPonytail),
		cacheDiagnostics: diagnosticsRun,
		requestKind,
		segment,
		replayMarkerMetadata: visionResolution.replayMarkerMetadata,
		modelDefinition: modelDef,
		pricingCurrency: getPricingCurrencyForBaseUrl(baseUrl),
		visionMarkerTextChars: visionResolution.stats.markerVisionTextChars || undefined,
		initialResponseNotice: joinNotices(mcpFallbackNotice, visionResolution.initialResponseNotice),
		visionMode: effectiveVisionMode,
		nativeImageParts: visionResolution.stats.nativeImageParts,
		nativeImageBytes: visionResolution.stats.nativeImageBytes,
	};
}

function joinNotices(...notices: readonly (string | undefined)[]): string | undefined {
	const joined = notices.filter((notice) => notice && notice.trim().length > 0).join('\n');
	return joined || undefined;
}

export const DEFAULT_IMAGE_HANDLING_INSTRUCTION =
	'[Image Handling]\n' +
	'Attached images are stored as local files; their paths appear in the conversation as "[Image attached at local file:]". ' +
	'You cannot see images inline — they must be processed through an image-capable MCP tool. ' +
	'The file name is a content hash, so the same path always refers to the same image.\n\n' +
	'Before processing an image, decide whether you can reuse an existing analysis or must process it again. ' +
	'The decision has TWO dimensions, checked in this order:\n\n' +
	'(1) Output-type match (PRIMARY). Every image task has an output type — what the user wants back. ' +
	"Common output types (non-exhaustive; infer from the user's goal, not from keywords): " +
	'understand/describe (what is in this image), convert/generate (turn this UI into code, prompt, or spec), ' +
	'compare (design vs implementation, find differences), extract (text/code/error from a screenshot), ' +
	'diagnose (error screenshot, stack trace), or general/uncertain. ' +
	"Reusing a prior analysis is valid only when the current task's output type MATCHES the output type that analysis was produced for. " +
	"If the user's requested output type differs from what the prior analysis/digest supports — " +
	'for example you previously described the image (understand) and now the user asks you to replicate it into code (convert/generate) — ' +
	'you MUST NOT reuse the description; choose the tool best matched to the new output type and process the image again, ' +
	'even if you already know the image contents well. ' +
	'The trigger is the output type changing, NOT the image changing and NOT missing detail.\n\n' +
	'(2) Information sufficiency within the same output type (SECONDARY). Only when the output type matches, then reuse unless one of:\n' +
	'(a) it has not been processed for this output type in this conversation;\n' +
	'(b) the current question needs detail the prior analysis did not cover; or\n' +
	'(c) the image may have changed since (for example, the user edited the UI and re-captured it).\n' +
	'When in doubt about output type, treat it as not-yet-processed and process with the most appropriate tool.\n\n' +
	"For the FIRST analysis of an image (no prior analysis exists), choose the tool best matched to the task's output type directly — " +
	'do not default to a general-purpose tool when a more specific tool fits the intent.\n\n' +
	'After you process an image, end with a one-line digest so later turns can reuse it without re-processing:\n' +
	'[Image digest | | | | |]\n' +
	'Keep it to one line — it is an index, not a full description. ' +
	'The field records which output type this analysis was produced for, so later turns can apply the match rule above. ' +
	'Update it if you re-process for a different output type (emit a new digest for the new output type; ' +
	'do not overwrite the old one if both may be reused).\n\n' +
	'Never invent the contents of an image you have not actually processed — if analysis is needed and none exists yet, call the tool. ' +
	'If processing fails, returns nothing useful, or leaves you uncertain, say so explicitly rather than guessing; ' +
	'the user must be able to tell when your understanding of an image may be wrong.\n\n' +
	'When the images at hand are stale, missing, or do not show the current state of the problem — ' +
	'for example the user has changed the code and is now reporting a visual bug, or a screenshot is too low-resolution to read an error — ' +
	'ask the user for a fresh, specific screenshot to ground your diagnosis. ' +
	'Ask only when a new capture would actually change your next step; otherwise proceed from what you have and state your assumptions. ' +
	'Request something concrete (the current top nav, the full error dialog with its stack trace), not a vague "send a screenshot".\n\n' +
	'Call the most appropriate image tool directly — ' +
	'do not mention tool names in your reply unless you are invoking that tool.\n\n';

function getImageHandlingInstruction(): string {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
	return (
		config.get<string>('imageHandlingPrompt', DEFAULT_IMAGE_HANDLING_INSTRUCTION) ||
		DEFAULT_IMAGE_HANDLING_INSTRUCTION
	);
}

function injectImageToolGuidance(messages: GLMMessage[]): void {
	const instruction = getImageHandlingInstruction();
	const systemMessage = messages.find((m) => m.role === 'system');
	if (systemMessage && typeof systemMessage.content === 'string') {
		systemMessage.content = `${instruction.trimEnd()}\n\n${systemMessage.content}`;
	} else if (systemMessage) {
		systemMessage.content = `${instruction.trimEnd()}\n\n${getGLMContentText(systemMessage.content)}`;
	} else {
		messages.unshift({
			role: 'system',
			content: instruction.trimEnd(),
		});
	}
}

/** No-op cache diagnostics run used when debug logging is disabled. */
function createNoopCacheDiagnosticsRun(): CacheDiagnosticsRun {
	return {
		onDone() {},
		onCancellationTokenRequested() {},
		onReplayMarkerReport() {},
		onUsage() {},
	};
}
