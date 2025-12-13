'use client';

import { FiTool } from 'react-icons/fi';
import styles from './maintenance.module.css';

export default function MaintenancePage() {
    return (
        <div className={styles.maintenancePage}>
            <div className={styles.maintenanceLogo}>
                <span className={styles.maintenanceLogoIcon}>R</span>
                Royal Commerce
            </div>
            <FiTool className={styles.maintenanceIcon} />
            <h1 className={styles.maintenanceTitle}>Under Maintenance</h1>
            <p className={styles.maintenanceText}>
                We&apos;re currently performing scheduled maintenance.
                Please check back soon. We apologize for any inconvenience.
            </p>
        </div>
    );
}
