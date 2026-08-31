/**
 * Shared types for the OpenRouter for Copilot extension.
 */

// ---- API request/response types ----

/** OpenAI-compatible multimodal text segment. */
export interface GLMTextContentPart {
	type: 'text';
	text: string;
}

/** OpenAI-compatible image segment backed by a generated data URL. */
export interface GLMImageContentPart {
	type: 'image_url';
	image_url: {
		url: string;
	};
}

export type GLMMessageContent = string | Array<GLMTextContentPart | GLMImageContentPart>;

export interface GLMMessage {
	role: 'system' | 'user' | 'assistant' | 'tool';
	content: GLMMessageContent;
	tool_call_id?: string;
	tool_calls?: GLMToolCall[];
	reasoning_content?: string;
}

export interface GLMToolCall {
	id: string;
	type: 'function';
	function: {
		name: string;
		arguments: string;
	};
}

export interface GLMTool {
	type: 'function';
	function: {
		name: string;
		description?: string;
		parameters?: Record<string, unknown>;
	};
}

export interface GLMUsage {
	prompt_tokens: number;
	completion_tokens: number;
	total_tokens: number;
	prompt_cache_hit_tokens?: number;
	prompt_cache_miss_tokens?: number;
	prompt_tokens_details?: {
		cached_tokens?: number;
	};
}

export interface GLMRequest {
	model: string;
	messages: GLMMessage[];
	stream: boolean;
	stream_options?: { include_usage?: boolean };
	temperature?: number;
	top_p?: number;
	max_tokens?: number;
	tools?: GLMTool[];
	tool_choice?: 'none' | 'auto' | 'required';
	thinking?: { type: 'enabled' | 'disabled'; clear_thinking?: boolean };
	reasoning_effort?: 'high' | 'max';
}

export interface GLMStreamChunk {
	id: string;
	object: string;
	created: number;
	model: string;
	choices: Array<{
		index: number;
		delta: {
			role?: string;
			content?: string;
			reasoning_content?: string;
			tool_calls?: Array<{
				index: number;
				id?: string;
				type?: string;
				function?: {
					name?: string;
					arguments?: string;
				};
			}>;
		};
		finish_reason: string | null;
	}>;
	usage?: GLMUsage;
}

// ---- Stream callbacks ----

export interface StreamCallbacks {
	onContent: (content: string) => void;
	onThinking: (text: string) => void;
	onToolCall: (toolCall: GLMToolCall) => void;
	onError: (error: Error) => void;
	onDone: () => void;
	onUsage?: (usage: GLMUsage) => void;
}

// ---- Configuration types ----

export type ApiProtocol = 'openai' | 'anthropic' | 'responses';

/**
 * How image attachments reach the model selected in Copilot.
 *
 * - `proxy`: a vision model describes images as text, then the selected model
 *   receives that text. Automatic proxy uses OpenRouter Gemini Flash.
 * - `native`: images are resized and sent as base64 directly to the API model.
 * - `mcp`: images are stored on disk and replaced with a local-path prompt so
 *   an image-capable MCP tool can read them.
 */
export type ModelVisionMode = 'proxy' | 'native' | 'mcp';

export type CustomModelConfigEntry = string | CustomModelConfig;

export interface CustomModelConfig {
	id?: string;
	name?: string;
	maxInputTokens?: number;
	maxOutputTokens?: number;
	toolCalling?: boolean;
	thinking?: boolean;
	imageInput?: boolean;
}

// ---- Model definitions ----

export type PricingCurrency = 'USD' | 'CNY';

export type PriceCategory = 'low' | 'medium' | 'high' | 'very_high';

export interface ModelPricing {
	cacheHitInput: number;
	cacheMissInput: number;
	output: number;
	tiers?: readonly ModelPricingTier[];
}

export interface ModelPricingTier {
	label: string;
	minPromptTokens?: number;
	maxPromptTokens?: number;
	cacheHitInput: number;
	cacheMissInput: number;
	output: number;
}

export interface ModelDefinition {
	id: string;
	name: string;
	family: string;
	version: string;
	detail: string;
	maxInputTokens: number;
	maxOutputTokens: number;
	capabilities: {
		toolCalling: boolean | number;
		/** Soft tool-count cap: tools are stably trimmed to this limit before
		 *  the hard `toolCalling` cap is enforced. Only applied for request
		 *  kinds in `REQUEST_KINDS_ELIGIBLE_FOR_TOOL_TRIMMING`. */
		preferredToolLimit?: number;
		imageInput: boolean;
		thinking: boolean;
	};
	requiresThinkingParam: boolean;
	supportsReasoningEffort?: boolean;
	/** models.dev marks retired/unavailable entries; these are hidden from the picker. */
	deprecated?: boolean;
	pricing?: Readonly<Partial<Record<PricingCurrency, ModelPricing>>>;
	priceCategory?: PriceCategory;
}
