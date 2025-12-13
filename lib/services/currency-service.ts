/**
 * Currency Service
 * Handles currency conversion and exchange rate fetching
 * Uses frankfurter.app API (free, no API key required)
 */

import { CURRENCY_SYMBOLS } from '@/lib/constants/currencies';


const EXCHANGE_API_URL = 'https://api.frankfurter.app';

export interface ExchangeRateResult {
    success: boolean;
    rate: number;
    from: string;
    to: string;
    date: string;
    error?: string;
}

/**
 * Fetch exchange rate from frankfurter.app API
 * Note: Uses EUR as base, so we need to calculate cross-rates for NGN
 */
export async function fetchExchangeRate(from: string, to: string): Promise<ExchangeRateResult> {
    try {
        // If same currency, return 1
        if (from === to) {
            return { success: true, rate: 1, from, to, date: new Date().toISOString() };
        }

        // Frankfurter API uses EUR as base for free tier
        // For currencies like NGN that might not be supported, we use fallback rates
        const FALLBACK_RATES_TO_USD: Record<string, number> = {
            NGN: 1550, // Approximate NGN to USD rate
            USD: 1,
            EUR: 0.92,
            GBP: 0.79,
            CAD: 1.36,
            AUD: 1.53,
            ZAR: 18.5,
            KES: 153,
            GHS: 15.2,
        };

        // If both currencies have fallback rates, calculate cross-rate
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
            };
        }

        // Try the API for other currencies
        const response = await fetch(`${EXCHANGE_API_URL}/latest?from=${from}&to=${to}`);

        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }

        const data = await response.json();

        if (data.rates && data.rates[to]) {
            return {
                success: true,
                rate: data.rates[to],
                from,
                to,
                date: data.date,
            };
        }

        throw new Error('Currency not found in response');
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
 * Convert price from one currency to another
 */
export function convertPrice(amount: number, exchangeRate: number): number {
    return parseFloat((amount / exchangeRate).toFixed(2));
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
