/**
 * Currency Service
 * Handles currency conversion and exchange rate fetching
 * Uses ExchangeRate-API (free tier: 1500 requests/month, supports NGN)
 * Fallback: Open Exchange Rates via frankfurter.app
 */

import { CURRENCY_SYMBOLS } from '@/lib/constants/currencies';

// Primary API: ExchangeRate-API (free tier supports NGN)
const EXCHANGERATE_API_URL = 'https://open.er-api.com/v6/latest';
// Fallback API: Frankfurter (doesn't support NGN but good for major currencies)
const FRANKFURTER_API_URL = 'https://api.frankfurter.app';

export interface ExchangeRateResult {
    success: boolean;
    rate: number;
    from: string;
    to: string;
    date: string;
    source?: string;
    error?: string;
}

/**
 * Fetch exchange rate from external APIs
 * Primary: ExchangeRate-API (supports NGN and 150+ currencies)
 * Fallback: Frankfurter API, then static fallback rates
 */
export async function fetchExchangeRate(from: string, to: string): Promise<ExchangeRateResult> {
    try {
        // If same currency, return 1
        if (from === to) {
            return { success: true, rate: 1, from, to, date: new Date().toISOString(), source: 'same' };
        }

        // Try ExchangeRate-API first (supports NGN)
        try {
            const response = await fetch(`${EXCHANGERATE_API_URL}/${from}`, {
                next: { revalidate: 3600 }, // Cache for 1 hour
            });

            if (response.ok) {
                const data = await response.json();
                if (data.result === 'success' && data.rates && data.rates[to]) {
                    return {
                        success: true,
                        rate: data.rates[to],
                        from,
                        to,
                        date: data.time_last_update_utc || new Date().toISOString(),
                        source: 'exchangerate-api',
                    };
                }
            }
        } catch (err) {
            console.warn('ExchangeRate-API failed, trying fallback:', err);
        }

        // Fallback: Try Frankfurter API (doesn't support NGN but good for EUR, USD, GBP, etc.)
        try {
            const response = await fetch(`${FRANKFURTER_API_URL}/latest?from=${from}&to=${to}`);
            if (response.ok) {
                const data = await response.json();
                if (data.rates && data.rates[to]) {
                    return {
                        success: true,
                        rate: data.rates[to],
                        from,
                        to,
                        date: data.date,
                        source: 'frankfurter',
                    };
                }
            }
        } catch (err) {
            console.warn('Frankfurter API failed, using static fallback:', err);
        }

        // Last resort: Static fallback rates (only used when all APIs fail)
        const FALLBACK_RATES_TO_USD: Record<string, number> = {
            NGN: 1550,
            USD: 1,
            EUR: 0.92,
            GBP: 0.79,
            CAD: 1.36,
            AUD: 1.53,
            ZAR: 18.5,
            KES: 153,
            GHS: 15.2,
            INR: 83,
            JPY: 149,
            CNY: 7.2,
        };

        if (FALLBACK_RATES_TO_USD[from] && FALLBACK_RATES_TO_USD[to]) {
            const fromToUsd = FALLBACK_RATES_TO_USD[from];
            const toToUsd = FALLBACK_RATES_TO_USD[to];
            const rate = fromToUsd / toToUsd;

            return {
                success: true,
                rate: parseFloat(rate.toFixed(6)),
                from,
                to,
                date: new Date().toISOString(),
                source: 'fallback',
            };
        }

        throw new Error(`No exchange rate available for ${from} to ${to}`);
    } catch (error) {
        console.error('Exchange rate fetch error:', error);
        return {
            success: false,
            rate: 1,
            from,
            to,
            date: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Failed to fetch exchange rate',
        };
    }
}

/**
 * Convert price from base currency to display currency
 * The exchangeRate is: 1 base currency = exchangeRate display currency
 * Example: if NGN→USD rate is 0.000645, then 1000 NGN * 0.000645 = 0.645 USD
 */
export function convertPrice(amount: number, exchangeRate: number): number {
    return parseFloat((amount * exchangeRate).toFixed(2));
}

/**
 * Format price with currency symbol
 */
export function formatPriceWithCurrency(
    amount: number,
    currencyCode: string,
    locale: string = 'en-US'
): string {
    const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode;

    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
            maximumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
        }).format(amount);
    } catch {
        // Fallback for unsupported currencies
        return `${symbol}${amount.toLocaleString(locale, { minimumFractionDigits: 2 })}`;
    }
}

/**
 * Get currency symbol for a currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
    return CURRENCY_SYMBOLS[currencyCode] || currencyCode;
}

