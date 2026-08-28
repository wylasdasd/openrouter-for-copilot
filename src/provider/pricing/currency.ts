import { isOpenRouterBaseUrl, isOpencodeBaseUrl, normalizeBaseUrl } from '../../endpoint';
import type { PricingCurrency } from '../../types';

/** OpenRouter (and legacy OpenCode hosts) expose USD pricing in the model picker. */
export function getPricingCurrencyForBaseUrl(baseUrl: string): PricingCurrency | undefined {
	const normalized = normalizeBaseUrl(baseUrl);
	if (isOpenRouterBaseUrl(normalized) || isOpencodeBaseUrl(normalized)) {
		return 'USD';
	}
	return undefined;
}
