'use client';

import { useEffect, useState } from 'react';
import { FiTool } from 'react-icons/fi';
import styles from './maintenance-overlay.module.css';

interface MaintenanceOverlayProps {
    message?: string;
}

export default function MaintenanceOverlay({ message }: MaintenanceOverlayProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [maintenanceData, setMaintenanceData] = useState<{
        isMaintenanceMode: boolean;
        maintenanceMessage: string;
    }>({ isMaintenanceMode: false, maintenanceMessage: '' });

    useEffect(() => {
        // Fetch settings to check maintenance mode
        const checkMaintenance = async () => {
            try {
                const response = await fetch('/api/settings');
                const data = await response.json();

                if (data.success && data.data.maintenanceMode) {
                    setMaintenanceData({
                        isMaintenanceMode: true,
                        maintenanceMessage: data.data.maintenanceMessage ||
                            'We are currently undergoing maintenance. Please check back soon.',
                    });
                    setIsVisible(true);
                }
            } catch (error) {
                console.error('Error checking maintenance mode:', error);
            }
        };

        checkMaintenance();
    }, []);

    if (!isVisible) {
        return null;
    }

    const displayMessage = message || maintenanceData.maintenanceMessage;

    return (
        <div className={styles.overlay}>
            <div className={styles.content}>
                <div className={styles.logoContainer}>
                    <span className={styles.logoIcon}>U</span>
                    <span className={styles.logoText}>UltraSpaceStore</span>
                </div>

                <div className={styles.icon}>
                    <FiTool />
                </div>

                <h1 className={styles.title}>Under Maintenance</h1>

                <p className={styles.message}>
                    {displayMessage}
                </p>

                <div className={styles.footer}>
                    We apologize for any inconvenience. Please try again later.
                </div>
            </div>
        </div>
    );
}
