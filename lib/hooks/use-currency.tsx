'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { fetchExchangeRate, formatPriceWithCurrency, convertPrice } from '@/lib/services/currency-service';

interface CurrencyContextType {
    currency: string;
    exchangeRate: number;
    loading: boolean;
    setCurrency: (currency: string) => void;
    format: (amount: number) => string;
    convert: (amount: number) => number;
    priceInCurrency: (amount: any) => string;
}

const CurrencyContext:any = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [currency, setCurrencyState] = useState('NGN');
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
                        setCurrencyState(data.displayCurrency || 'NGN');
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
        setCurrencyState(newCurrency);
    };

    const convert = useCallback((amount: number) => {
        if (currency === 'NGN') return amount;
        return convertPrice(amount, exchangeRate);
    }, [currency, exchangeRate]);

    const format = useCallback((amount: number) => {
        return formatPriceWithCurrency(amount, currency);
    }, [currency]);

    const priceInCurrency = useCallback((amount: number) => {
        const converted = convert(amount);
        return format(converted);
    }, [convert, format]);

    const value = {
        currency,
        exchangeRate,
        loading,
        setCurrency,
        format,
        convert,
        priceInCurrency
    };

    return (
        <CurrencyContext.Provider value= { value } >
        { children }
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context:any = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
}
