'use client';

import { useEffect, useState } from 'react';
import { FiSettings, FiGlobe, FiMail, FiShield, FiDatabase, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { settingsApi } from '@/lib/services/api';
import styles from './page.module.css';

interface Settings {
    maintenanceMode: boolean;
    siteName: string;
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await settingsApi.get();
                setSettings(response.data.data);
            } catch (error) {
                console.error('Failed to fetch settings:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const toggleMaintenance = async () => {
        if (!settings) return;
        setSaving('maintenance');
        try {
            const newValue = !settings.maintenanceMode;
            await settingsApi.update({ maintenanceMode: newValue });
            setSettings({ ...settings, maintenanceMode: newValue });
        } catch (error) {
            console.error('Failed to update settings:', error);
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return <div className={styles.loading}>Loading settings...</div>;
    }

    return (
        <div className={styles.page}>
            {/* Page Header */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Settings</h1>
                    <p className={styles.pageSubtitle}>Manage your store configuration</p>
                </div>
            </div>

            {/* Settings Grid */}
            <div className={styles.settingsGrid}>
                {/* General Settings */}
                <div className={styles.settingsCard}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardIcon}>
                            <FiGlobe size={20} />
                        </div>
                        <div>
                            <h2 className={styles.cardTitle}>General</h2>
                            <p className={styles.cardDescription}>Basic store settings</p>
                        </div>
                    </div>
                    <div className={styles.settingsList}>
                        <div className={styles.settingItem}>
                            <div className={styles.settingInfo}>
                                <span className={styles.settingLabel}>Store Name</span>
                                <span className={styles.settingValue}>{settings?.siteName || 'Royal Commerce'}</span>
                            </div>
                            <button className={styles.editBtn}>Edit</button>
                        </div>
                        <div className={styles.settingItem}>
                            <div className={styles.settingInfo}>
                                <span className={styles.settingLabel}>Currency</span>
                                <span className={styles.settingValue}>NGN (₦)</span>
                            </div>
                            <button className={styles.editBtn}>Edit</button>
                        </div>
                    </div>
                </div>

                {/* Site Status */}
                <div className={styles.settingsCard}>
                    <div className={styles.cardHeader}>
                        <div className={`${styles.cardIcon} ${styles.iconWarning}`}>
                            <FiShield size={20} />
                        </div>
                        <div>
                            <h2 className={styles.cardTitle}>Site Status</h2>
                            <p className={styles.cardDescription}>Control site availability</p>
                        </div>
                    </div>
                    <div className={styles.settingsList}>
                        <div className={styles.settingItem}>
                            <div className={styles.settingInfo}>
                                <span className={styles.settingLabel}>Maintenance Mode</span>
                                <span className={styles.settingDescription}>
                                    When enabled, visitors see a maintenance page
                                </span>
                            </div>
                            <button
                                className={`${styles.toggle} ${settings?.maintenanceMode ? styles.active : ''}`}
                                onClick={toggleMaintenance}
                                disabled={saving === 'maintenance'}
                            >
                                {settings?.maintenanceMode ? <FiToggleRight size={28} /> : <FiToggleLeft size={28} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className={styles.settingsCard}>
                    <div className={styles.cardHeader}>
                        <div className={`${styles.cardIcon} ${styles.iconBlue}`}>
                            <FiMail size={20} />
                        </div>
                        <div>
                            <h2 className={styles.cardTitle}>Notifications</h2>
                            <p className={styles.cardDescription}>Email and push settings</p>
                        </div>
                    </div>
                    <div className={styles.settingsList}>
                        <div className={styles.settingItem}>
                            <div className={styles.settingInfo}>
                                <span className={styles.settingLabel}>Order Notifications</span>
                                <span className={styles.settingDescription}>
                                    Receive email for new orders
                                </span>
                            </div>
                            <button className={`${styles.toggle} ${styles.active}`}>
                                <FiToggleRight size={28} />
                            </button>
                        </div>
                        <div className={styles.settingItem}>
                            <div className={styles.settingInfo}>
                                <span className={styles.settingLabel}>Low Stock Alerts</span>
                                <span className={styles.settingDescription}>
                                    Get notified when stock is low
                                </span>
                            </div>
                            <button className={styles.toggle}>
                                <FiToggleLeft size={28} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* API & Integrations */}
                <div className={styles.settingsCard}>
                    <div className={styles.cardHeader}>
                        <div className={`${styles.cardIcon} ${styles.iconGreen}`}>
                            <FiDatabase size={20} />
                        </div>
                        <div>
                            <h2 className={styles.cardTitle}>Integrations</h2>
                            <p className={styles.cardDescription}>Payment and API settings</p>
                        </div>
                    </div>
                    <div className={styles.settingsList}>
                        <div className={styles.settingItem}>
                            <div className={styles.settingInfo}>
                                <span className={styles.settingLabel}>Paystack</span>
                                <span className={`${styles.settingBadge} ${styles.connected}`}>Connected</span>
                            </div>
                            <button className={styles.editBtn}>Configure</button>
                        </div>
                        <div className={styles.settingItem}>
                            <div className={styles.settingInfo}>
                                <span className={styles.settingLabel}>MongoDB</span>
                                <span className={`${styles.settingBadge} ${styles.connected}`}>Connected</span>
                            </div>
                            <button className={styles.editBtn}>View</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
