'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';

interface SystemSettings {
    siteName: string;
    siteDescription: string;
    maintenanceMode: boolean;
    maintenanceMessage: string;
    baseCurrency: string;
    displayCurrency: string;
    exchangeRate: number;
    currencySymbol: string;
    paystackEnabled: boolean;
    freeShippingThreshold: number;
    defaultShippingFee: number;
}

interface SettingsContextType {
    settings: SystemSettings | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

const defaultSettings: SystemSettings = {
    siteName: 'UltraSpaceStore',
    siteDescription: 'Premium E-Commerce Platform',
    maintenanceMode: false,
    maintenanceMessage: 'We are currently undergoing maintenance. Please check back soon.',
    baseCurrency: 'NGN',
    displayCurrency: 'NGN',
    exchangeRate: 1,
    currencySymbol: '₦',
    paystackEnabled: true,
    freeShippingThreshold: 50000,
    defaultShippingFee: 2500,
};

const SettingsContext = createContext<SettingsContextType>({
    settings: null,
    loading: true,
    error: null,
    refetch: async () => { },
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSettings = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('/api/settings');
            const data = await response.json();

            if (data.success) {
                setSettings(data.data);
            } else {
                setError(data.error || 'Failed to fetch settings');
                setSettings(defaultSettings);
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
            setError('Failed to fetch settings');
            setSettings(defaultSettings);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    return (
        <SettingsContext.Provider value={{ settings, loading, error, refetch: fetchSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    return context;
}

// Convenience hook for maintenance mode specifically
export function useMaintenanceMode() {
    const { settings, loading } = useSettings();
    return {
        isMaintenanceMode: settings?.maintenanceMode ?? false,
        maintenanceMessage: settings?.maintenanceMessage ?? defaultSettings.maintenanceMessage,
        loading,
    };
}

export default useSettings;
