'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { formatPriceWithCurrency, convertPrice } from '@/lib/services/currency-service';

interface CurrencyContextType {
    baseCurrency: string;
    displayCurrency: string;
    exchangeRate: number;
    loading: boolean;
    setCurrency: (currency: string) => void;
    format: (amount: number) => string;
    convert: (amount: number) => number;
    priceInCurrency: (amount: any) => string;
}

const CurrencyContext: any = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [baseCurrency, setBaseCurrency] = useState('NGN');
    const [displayCurrency, setDisplayCurrency] = useState('NGN');
    const [exchangeRate, setExchangeRate] = useState(1);
    const [loading, setLoading] = useState(true);

    // Initial load of settings
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const response = await fetch('/api/exchange-rate');
                if (response.ok) {
                    const { data } = await response.json();
                    if (data) {
                        setBaseCurrency(data.baseCurrency || 'NGN');
                        setDisplayCurrency(data.displayCurrency || 'NGN');
                        setExchangeRate(data.exchangeRate || 1);
                    }
                }
            } catch (error) {
                console.error('Failed to load currency settings', error);
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, []);

    const setCurrency = (newCurrency: string) => {
        setDisplayCurrency(newCurrency);
    };

    // Convert amount from base currency to display currency
    const convert = useCallback((amount: number) => {
        // If same currency or rate is 1, no conversion needed
        if (baseCurrency === displayCurrency || exchangeRate === 1) {
            return amount;
        }
        // Apply conversion: multiply by exchange rate (base -> display)
        return convertPrice(amount, exchangeRate);
    }, [baseCurrency, displayCurrency, exchangeRate]);

    // Format amount with display currency symbol
    const format = useCallback((amount: number) => {
        return formatPriceWithCurrency(amount, displayCurrency);
    }, [displayCurrency]);

    // Convert and format in one step
    const priceInCurrency = useCallback((amount: number) => {
        const converted = convert(amount);
        return format(converted);
    }, [convert, format]);

    const value = {
        baseCurrency,
        currency: displayCurrency, // Keep 'currency' for backwards compatibility
        displayCurrency,
        exchangeRate,
        loading,
        setCurrency,
        format,
        convert,
        priceInCurrency
    };

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context: any = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
}
