import type { ModelDefinition, PriceCategory, PricingCurrency } from '../../types';

const COST_DECIMALS = 4;
const COST_SCALE = 10 ** COST_DECIMALS;

/**
 * Credits per 1M tokens — ceil to 4 decimal places.
 * OpenRouter per-token × 1e6 often yields 0.7999999… in JS; snap first, then ceil.
 */
export function ceilCostPerMillion(value: number): number {
	if (!Number.isFinite(value)) {
		return value;
	}
	if (value <= 0) {
		return 0;
	}
	const snapped = Math.round(value * 1e6) / 1e6;
	return Math.ceil(Math.round(snapped * COST_SCALE)) / COST_SCALE;
}

/**
 * VS Code's proposed cost fields are numeric credits per 1M tokens — the
 * Copilot model picker renders the numbers itself (own units, own currency
 * symbol). Formatted strings like "$0.95" in these fields parse as NaN in
 * current UI builds and render as "Unknown", so pass raw numbers.
 *
 * Mapping:
 * - inputCost  <- cacheMissInput, the representative non-cached input price.
 * - cacheCost  <- cacheHitInput, shown separately as the cached-input tier.
 * - outputCost <- output.
 *
 * priceCategory is emitted only together with concrete official pricing; incomplete
 * pricing intentionally suppresses all cost metadata.
 */
export interface ModelCostInformation {
	readonly inputCost?: number;
	readonly outputCost?: number;
	readonly cacheCost?: number;
	readonly priceCategory?: PriceCategory;
}

export function toModelCostInfo(
	model: ModelDefinition,
	currency?: PricingCurrency,
): ModelCostInformation {
	if (!currency) {
		return {};
	}

	const pricing = model.pricing?.[currency];
	if (!pricing) {
		return {};
	}

	return {
		...(model.priceCategory ? { priceCategory: model.priceCategory } : {}),
		inputCost: ceilCostPerMillion(pricing.cacheMissInput),
		outputCost: ceilCostPerMillion(pricing.output),
		cacheCost: ceilCostPerMillion(pricing.cacheHitInput),
	};
}
