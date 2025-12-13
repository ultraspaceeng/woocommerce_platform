'use client';

import { useEffect, useState } from 'react';
import { FiSettings, FiGlobe, FiDollarSign, FiTruck, FiBell, FiMapPin, FiSave, FiRefreshCw } from 'react-icons/fi';
import { settingsApi } from '@/lib/services/api';
import { SUPPORTED_CURRENCIES, CURRENCY_SYMBOLS } from '@/lib/constants/currencies';
import styles from './page.module.css';

interface Settings {
    siteName: string;
    siteDescription: string;
    contactEmail: string;
    supportPhone: string;
    maintenanceMode: boolean;
    maintenanceMessage: string;
    baseCurrency: string;
    displayCurrency: string;
    exchangeRate: number;
    exchangeRateUpdatedAt: string | null;
    currencySymbol: string;
    paystackEnabled: boolean;
    freeShippingThreshold: number;
    defaultShippingFee: number;
    orderEmailNotifications: boolean;
    lowStockAlerts: boolean;
    lowStockThreshold: number;
    storeAddress: string;
    storeCity: string;
    storeState: string;
    storeCountry: string;
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<Settings>({
        siteName: 'Royal Commerce',
        siteDescription: '',
        contactEmail: '',
        supportPhone: '',
        maintenanceMode: false,
        maintenanceMessage: '',
        baseCurrency: 'NGN',
        displayCurrency: 'NGN',
        exchangeRate: 1,
        exchangeRateUpdatedAt: null,
        currencySymbol: '₦',
        paystackEnabled: true,
        freeShippingThreshold: 50000,
        defaultShippingFee: 2500,
        orderEmailNotifications: true,
        lowStockAlerts: true,
        lowStockThreshold: 10,
        storeAddress: '',
        storeCity: 'Lagos',
        storeState: 'Lagos',
        storeCountry: 'Nigeria',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [refreshingRate, setRefreshingRate] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await settingsApi.get();
                if (response.data.success) {
                    setSettings(prev => ({ ...prev, ...response.data.data }));
                }
            } catch (error) {
                console.error('Failed to fetch settings:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
                type === 'number' ? parseFloat(value) || 0 : value,
        }));
        setSaved(false);
    };

    const handleToggle = (name: keyof Settings) => {
        setSettings(prev => ({ ...prev, [name]: !prev[name] }));
        setSaved(false);
    };

    const handleCurrencyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCurrency = e.target.value;
        const newSymbol = CURRENCY_SYMBOLS[newCurrency] || newCurrency;

        setSettings(prev => ({
            ...prev,
            displayCurrency: newCurrency,
            currencySymbol: newSymbol,
        }));
        setSaved(false);
    };

    const handleRefreshRate = async () => {
        setRefreshingRate(true);
        try {
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
            } else {
                alert('Failed to refresh exchange rate');
            }
        } catch (error) {
            console.error('Failed to refresh rate:', error);
            alert('Failed to refresh exchange rate');
        } finally {
            setRefreshingRate(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await settingsApi.update(settings);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className={styles.loading}>Loading settings...</div>;
    }

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'Never';
        return new Date(dateStr).toLocaleString();
    };

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Settings</h1>
                    <p className={styles.pageSubtitle}>Configure your store settings</p>
                </div>
                <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                    <FiSave size={16} />
                    {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
                </button>
            </div>

            <div className={styles.settingsGrid}>
                {/* General Settings */}
                <div className={styles.settingsCard}>
                    <div className={styles.cardHeader}>
                        <FiGlobe size={20} />
                        <h2>General</h2>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.formGroup}>
                            <label>Site Name</label>
                            <input
                                type="text"
                                name="siteName"
                                value={settings.siteName}
                                onChange={handleChange}
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Site Description</label>
                            <textarea
                                name="siteDescription"
                                value={settings.siteDescription}
                                onChange={handleChange}
                                className={styles.textarea}
                                rows={2}
                            />
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Contact Email</label>
                                <input
                                    type="email"
                                    name="contactEmail"
                                    value={settings.contactEmail}
                                    onChange={handleChange}
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Support Phone</label>
                                <input
                                    type="tel"
                                    name="supportPhone"
                                    value={settings.supportPhone}
                                    onChange={handleChange}
                                    className={styles.input}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Site Status */}
                <div className={styles.settingsCard}>
                    <div className={styles.cardHeader}>
                        <FiSettings size={20} />
                        <h2>Site Status</h2>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.toggleRow}>
                            <div>
                                <h4>Maintenance Mode</h4>
                                <p>Temporarily disable the store for maintenance</p>
                            </div>
                            <button
                                className={`${styles.toggle} ${settings.maintenanceMode ? styles.active : ''}`}
                                onClick={() => handleToggle('maintenanceMode')}
                            >
                                <span className={styles.toggleKnob} />
                            </button>
                        </div>
                        {settings.maintenanceMode && (
                            <div className={styles.formGroup}>
                                <label>Maintenance Message</label>
                                <textarea
                                    name="maintenanceMessage"
                                    value={settings.maintenanceMessage}
                                    onChange={handleChange}
                                    className={styles.textarea}
                                    rows={2}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Currency & Payment Settings */}
                <div className={styles.settingsCard}>
                    <div className={styles.cardHeader}>
                        <FiDollarSign size={20} />
                        <h2>Currency & Payment</h2>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Base Currency (Stored)</label>
                                <input
                                    type="text"
                                    value={settings.baseCurrency}
                                    className={styles.input}
                                    disabled
                                />
                                <span className={styles.helperText}>Prices are stored in this currency</span>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Display Currency</label>
                                <select
                                    name="displayCurrency"
                                    value={settings.displayCurrency}
                                    onChange={handleCurrencyChange}
                                    className={styles.select}
                                >
                                    {SUPPORTED_CURRENCIES.map(currency => (
                                        <option key={currency.code} value={currency.code}>
                                            {currency.symbol} {currency.code} - {currency.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {settings.baseCurrency !== settings.displayCurrency && (
                            <div className={styles.exchangeRateBox}>
                                <div className={styles.rateInfo}>
                                    <span className={styles.rateLabel}>Exchange Rate</span>
                                    <span className={styles.rateValue}>
                                        1 {settings.displayCurrency} = {settings.exchangeRate?.toFixed(2) || '—'} {settings.baseCurrency}
                                    </span>
                                    <span className={styles.rateUpdated}>
                                        Last updated: {formatDate(settings.exchangeRateUpdatedAt)}
                                    </span>
                                </div>
                                <button
                                    className={styles.refreshBtn}
                                    onClick={handleRefreshRate}
                                    disabled={refreshingRate}
                                >
                                    <FiRefreshCw size={14} className={refreshingRate ? styles.spinning : ''} />
                                    {refreshingRate ? 'Refreshing...' : 'Refresh Rate'}
                                </button>
                            </div>
                        )}

                        <div className={styles.toggleRow}>
                            <div>
                                <h4>Paystack Payments</h4>
                                <p>Enable online payment via Paystack</p>
                            </div>
                            <button
                                className={`${styles.toggle} ${settings.paystackEnabled ? styles.active : ''}`}
                                onClick={() => handleToggle('paystackEnabled')}
                            >
                                <span className={styles.toggleKnob} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Shipping Settings */}
                <div className={styles.settingsCard}>
                    <div className={styles.cardHeader}>
                        <FiTruck size={20} />
                        <h2>Shipping</h2>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Free Shipping Threshold ({settings.currencySymbol})</label>
                                <input
                                    type="number"
                                    name="freeShippingThreshold"
                                    value={settings.freeShippingThreshold}
                                    onChange={handleChange}
                                    className={styles.input}
                                    min={0}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Default Shipping Fee ({settings.currencySymbol})</label>
                                <input
                                    type="number"
                                    name="defaultShippingFee"
                                    value={settings.defaultShippingFee}
                                    onChange={handleChange}
                                    className={styles.input}
                                    min={0}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notification Settings */}
                <div className={styles.settingsCard}>
                    <div className={styles.cardHeader}>
                        <FiBell size={20} />
                        <h2>Notifications</h2>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.toggleRow}>
                            <div>
                                <h4>Order Email Notifications</h4>
                                <p>Send email notifications for new orders</p>
                            </div>
                            <button
                                className={`${styles.toggle} ${settings.orderEmailNotifications ? styles.active : ''}`}
                                onClick={() => handleToggle('orderEmailNotifications')}
                            >
                                <span className={styles.toggleKnob} />
                            </button>
                        </div>
                        <div className={styles.toggleRow}>
                            <div>
                                <h4>Low Stock Alerts</h4>
                                <p>Get notified when products are running low</p>
                            </div>
                            <button
                                className={`${styles.toggle} ${settings.lowStockAlerts ? styles.active : ''}`}
                                onClick={() => handleToggle('lowStockAlerts')}
                            >
                                <span className={styles.toggleKnob} />
                            </button>
                        </div>
                        {settings.lowStockAlerts && (
                            <div className={styles.formGroup}>
                                <label>Low Stock Threshold</label>
                                <input
                                    type="number"
                                    name="lowStockThreshold"
                                    value={settings.lowStockThreshold}
                                    onChange={handleChange}
                                    className={styles.input}
                                    min={1}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Store Location */}
                <div className={styles.settingsCard}>
                    <div className={styles.cardHeader}>
                        <FiMapPin size={20} />
                        <h2>Store Location</h2>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.formGroup}>
                            <label>Store Address</label>
                            <input
                                type="text"
                                name="storeAddress"
                                value={settings.storeAddress}
                                onChange={handleChange}
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>City</label>
                                <input
                                    type="text"
                                    name="storeCity"
                                    value={settings.storeCity}
                                    onChange={handleChange}
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>State</label>
                                <input
                                    type="text"
                                    name="storeState"
                                    value={settings.storeState}
                                    onChange={handleChange}
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Country</label>
                                <input
                                    type="text"
                                    name="storeCountry"
                                    value={settings.storeCountry}
                                    onChange={handleChange}
                                    className={styles.input}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

