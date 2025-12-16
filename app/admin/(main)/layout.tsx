'use client';

import { ReactNode, useState } from 'react';
import { FiMenu, FiBell, FiSearch } from 'react-icons/fi';
import { Toaster } from 'react-hot-toast';
import AdminSidebar from '@/components/layout/admin-sidebar';
import ThemeToggle from '@/components/ui/theme-toggle';
import PushNotificationPrompt from '@/components/ui/push-notification-prompt';
import '../admin.css';
import styles from './layout.module.css';

export default function AdminLayout({ children }: { children: ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className={`${styles.adminLayout} adminLayout`}>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: 'var(--card-bg)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                    },
                    success: {
                        iconTheme: {
                            primary: 'var(--success-color, #22c55e)',
                            secondary: 'white',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: 'var(--error-color, #ef4444)',
                            secondary: 'white',
                        },
                    },
                }}
            />
            <AdminSidebar isOpen={sidebarOpen} />

            <div className={styles.adminMain}>
                <header className={styles.adminHeader}>
                    <div className={styles.headerLeft}>
                        <button
                            className={styles.menuButton}
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            <FiMenu size={20} />
                        </button>
                        <div className={styles.searchBar}>
                            <FiSearch size={18} className={styles.searchIcon} />
                            <input
                                type="text"
                                placeholder="Search products, orders, customers..."
                                className={styles.searchInput}
                            />
                        </div>
                    </div>

                    <div className={styles.headerRight}>
                        <button className={styles.headerButton}>
                            <FiBell size={20} />
                            <span className={styles.notificationDot} />
                        </button>
                        <ThemeToggle />
                    </div>
                </header>

                <main className={styles.adminContent}>
                    {children}
                </main>
            </div>

            {sidebarOpen && (
                <div
                    className={`${styles.adminOverlay} ${styles.visible}`}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Admin Push Notification Prompt */}
            <PushNotificationPrompt type="admin" />
        </div>
    );
}

