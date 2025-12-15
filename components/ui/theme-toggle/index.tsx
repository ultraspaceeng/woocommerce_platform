'use client';

import { useTheme } from '@/lib/context/theme-context';
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi';
import styles from './theme-toggle.module.css';

interface ThemeToggleProps {
    showLabel?: boolean;
}

export default function ThemeToggle({ showLabel = false }: ThemeToggleProps) {
    const { theme, toggleTheme, mounted } = useTheme();

    // Prevent hydration mismatch
    if (!mounted) {
        return <div className={styles.toggle} style={{ width: 40, height: 40 }} />;
    }

    const getIcon = () => {
        switch (theme) {
            case 'light':
                return <FiSun className={styles.icon} size={20} />;
            case 'dark':
                return <FiMoon className={styles.icon} size={20} />;
            case 'system':
                return <FiMonitor className={styles.icon} size={20} />;
            default:
                return <FiMonitor className={styles.icon} size={20} />;
        }
    };

    const getLabel = () => {
        switch (theme) {
            case 'light': return 'Light';
            case 'dark': return 'Dark';
            case 'system': return 'Auto';
            default: return 'Auto';
        }
    };

    return (
        <button
            className={styles.toggle}
            onClick={toggleTheme}
            aria-label={`Current theme: ${getLabel()}. Click to switch.`}
            title={`Current theme: ${getLabel()}. Click to switch.`}
        >
            <div className={styles.iconWrapper}>
                {getIcon()}
            </div>
            {showLabel && (
                <span className={styles.label}>
                    {getLabel()}
                </span>
            )}
        </button>
    );
}

