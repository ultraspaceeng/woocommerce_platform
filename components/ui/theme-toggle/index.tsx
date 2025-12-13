'use client';

import { useTheme } from '@/lib/context/theme-context';
import { FiSun, FiMoon } from 'react-icons/fi';
import styles from './theme-toggle.module.css';

interface ThemeToggleProps {
    showLabel?: boolean;
}

export default function ThemeToggle({ showLabel = false }: ThemeToggleProps) {
    const { theme, toggleTheme, mounted } = useTheme();

    // Prevent hydration mismatch by showing nothing until mounted
    if (!mounted) {
        return <div className={styles.toggle} style={{ width: 40, height: 40 }} />;
    }

    return (
        <button
            className={styles.toggle}
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            <div className={styles.iconWrapper}>
                <FiSun className={`${styles.icon} ${styles.sunIcon}`} size={20} />
                <FiMoon className={`${styles.icon} ${styles.moonIcon}`} size={20} />
            </div>
            {showLabel && (
                <span className={styles.label}>
                    {theme === 'light' ? 'Light' : 'Dark'}
                </span>
            )}
        </button>
    );
}

