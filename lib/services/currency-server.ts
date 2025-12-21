/**
 * Server-Side Currency Service
 * Handles currency operations that require database access
 * This file should ONLY be imported by server-side code (API routes, email services, etc.)
 */

import connectDB from '@/lib/db/mongodb';
import SystemSettings from '@/lib/models/system-settings';
import { formatPriceWithCurrency, convertPrice } from './currency-service';

export interface CurrencySettings {
    baseCurrency: string;
    displayCurrency: string;
    exchangeRate: number;
    currencySymbol: string;
}

// Cache for currency settings to avoid repeated DB calls
let cachedSettings: CurrencySettings | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Get currency settings from the database (server-side only)
 * Uses caching to avoid excessive DB calls
 */
export async function getCurrencySettings(): Promise<CurrencySettings> {
    const now = Date.now();

    // Return cached if still valid
    if (cachedSettings && (now - cacheTimestamp) < CACHE_TTL) {
        return cachedSettings;
    }

    try {
        await connectDB();
        const settings = await SystemSettings.findOne().lean();

        cachedSettings = {
            baseCurrency: (settings?.baseCurrency as string) || 'NGN',
            displayCurrency: (settings?.displayCurrency as string) || 'NGN',
            exchangeRate: (settings?.exchangeRate as number) || 1,
            currencySymbol: (settings?.currencySymbol as string) || '₦',
        };
        cacheTimestamp = now;

        return cachedSettings;
    } catch (error) {
        console.error('Failed to fetch currency settings:', error);
        // Return defaults if DB fetch fails
        return {
            baseCurrency: 'NGN',
            displayCurrency: 'NGN',
            exchangeRate: 1,
            currencySymbol: '₦',
        };
    }
}

/**
 * Clear the currency settings cache (useful after settings update)
 */
export function clearCurrencyCache(): void {
    cachedSettings = null;
    cacheTimestamp = 0;
}

/**
 * Format a price for server-side use (emails, push notifications)
 * Automatically fetches current currency settings and applies conversion
 * @param amount - The amount in BASE currency (NGN)
 * @returns Formatted price string in display currency
 */
export async function formatServerPrice(amount: number): Promise<string> {
    const settings = await getCurrencySettings();
    const converted = convertPrice(amount, settings.exchangeRate);
    return formatPriceWithCurrency(converted, settings.displayCurrency);
}

/**
 * Synchronous price formatting when settings are already available
 * @param amount - The amount in BASE currency (NGN)
 * @param settings - Currency settings object
 * @returns Formatted price string in display currency
 */
export function formatPriceWithSettings(amount: number, settings: CurrencySettings): string {
    const converted = convertPrice(amount, settings.exchangeRate);
    return formatPriceWithCurrency(converted, settings.displayCurrency);
}
