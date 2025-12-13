'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { CURRENCY_SYMBOLS, SUPPORTED_CURRENCIES } from '@/lib/constants/currencies';

interface CurrencySettings {
    baseCurrency: string;
    displayCurrency: string;
    exchangeRate: number;
    exchangeRateUpdatedAt: string | null;
    currencySymbol: string;
}

interface UseCurrencyReturn {
    // Settings
    settings: CurrencySettings;
    loading: boolean;
    error: string | null;

    // Functions
    formatPrice: (amount: number) => string;
    convertAndFormat: (amount: number) => string;
    convertPrice: (amount: number) => number;
    refreshRate: () => Promise<void>;
    updateCurrency: (currencyCode: string) => Promise<void>;

    // Data
    supportedCurrencies: typeof SUPPORTED_CURRENCIES;
}

const DEFAULT_SETTINGS: CurrencySettings = {
    baseCurrency: 'NGN',
    displayCurrency: 'NGN',
    exchangeRate: 1,
    exchangeRateUpdatedAt: null,
    currencySymbol: '₦',
};

/**
 * Hook for accessing and managing currency settings across the platform
 */
export function useCurrency(): UseCurrencyReturn {
    const [settings, setSettings] = useState<CurrencySettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch initial settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/exchange-rate');
                const data = await response.json();

                if (data.success && data.data) {
                    setSettings({
                        baseCurrency: data.data.baseCurrency || 'NGN',
                        displayCurrency: data.data.displayCurrency || 'NGN',
                        exchangeRate: data.data.exchangeRate || 1,
                        exchangeRateUpdatedAt: data.data.exchangeRateUpdatedAt,
                        currencySymbol: data.data.currencySymbol || '₦',
                    });
                }
            } catch (err) {
                console.error('Failed to fetch currency settings:', err);
                setError('Failed to load currency settings');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    // Convert price from base to display currency
    const convertPrice = useCallback((amount: number): number => {
        if (settings.baseCurrency === settings.displayCurrency) {
            return amount;
        }
        return parseFloat((amount / settings.exchangeRate).toFixed(2));
    }, [settings.baseCurrency, settings.displayCurrency, settings.exchangeRate]);

    // Format price with currency symbol (no conversion)
    const formatPrice = useCallback((amount: number): string => {
        const symbol = settings.currencySymbol;

        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: settings.displayCurrency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            }).format(amount);
        } catch {
            return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
        }
    }, [settings.currencySymbol, settings.displayCurrency]);

    // Convert and format in one step
    const convertAndFormat = useCallback((amount: number): string => {
        const converted = convertPrice(amount);
        return formatPrice(converted);
    }, [convertPrice, formatPrice]);

    // Refresh exchange rate
    const refreshRate = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/exchange-rate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ displayCurrency: settings.displayCurrency }),
            });
            const data = await response.json();

            if (data.success && data.data) {
                setSettings(prev => ({
                    ...prev,
                    exchangeRate: data.data.exchangeRate,
                    exchangeRateUpdatedAt: data.data.exchangeRateUpdatedAt,
                }));
            }
        } catch (err) {
            console.error('Failed to refresh exchange rate:', err);
            setError('Failed to refresh exchange rate');
        } finally {
            setLoading(false);
        }
    }, [settings.displayCurrency]);

    // Update display currency
    const updateCurrency = useCallback(async (currencyCode: string) => {
        try {
            setLoading(true);
            const response = await fetch('/api/exchange-rate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ displayCurrency: currencyCode }),
            });
            const data = await response.json();

            if (data.success && data.data) {
                setSettings({
                    baseCurrency: data.data.baseCurrency,
                    displayCurrency: data.data.displayCurrency,
                    exchangeRate: data.data.exchangeRate,
                    exchangeRateUpdatedAt: data.data.exchangeRateUpdatedAt,
                    currencySymbol: data.data.currencySymbol,
                });
            } else {
                throw new Error(data.error || 'Failed to update currency');
            }
        } catch (err) {
            console.error('Failed to update currency:', err);
            setError(err instanceof Error ? err.message : 'Failed to update currency');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        settings,
        loading,
        error,
        formatPrice,
        convertAndFormat,
        convertPrice,
        refreshRate,
        updateCurrency,
        supportedCurrencies: SUPPORTED_CURRENCIES,
    };
}

export default useCurrency;
