'use client';

import { useEffect, useState, memo } from 'react';
import { useCartStore, CartMessage } from '@/lib/stores/cart-store';
import { FiCheck, FiAlertTriangle, FiX, FiInfo } from 'react-icons/fi';
import styles from './Toast.module.css';

interface ToastItemData extends CartMessage {
    id: string;
    isExiting: boolean;
}

const TOAST_DURATION = 4000;

const ToastItem = memo(({
    toast,
    onDismiss
}: {
    toast: ToastItemData;
    onDismiss: (id: string) => void;
}) => {
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (toast.isExiting || isPaused) return;

        const timer = setTimeout(() => {
            onDismiss(toast.id);
        }, TOAST_DURATION);

        return () => clearTimeout(timer);
    }, [toast.id, toast.isExiting, isPaused, onDismiss]);

    const getIcon = (type: CartMessage['type']) => {
        switch (type) {
            case 'success':
                return <FiCheck />;
            case 'warning':
                return <FiAlertTriangle />;
            case 'error':
                return <FiX />;
            default:
                return <FiInfo />;
        }
    };

    const getTitle = (type: CartMessage['type']) => {
        switch (type) {
            case 'success':
                return 'Success';
            case 'warning':
                return 'Warning';
            case 'error':
                return 'Error';
            default:
                return 'Info';
        }
    };

    return (
        <div
            className={`${styles.toast} ${styles[toast.type]} ${toast.isExiting ? styles.exiting : ''}`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            role="alert"
        >
            <div className={styles.iconContainer}>
                {getIcon(toast.type)}
            </div>

            <div className={styles.content}>
                <div className={styles.title}>{getTitle(toast.type)}</div>
                <p className={styles.message}>{toast.message}</p>
            </div>

            <button
                className={styles.close}
                onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(toast.id);
                }}
                aria-label="Close notification"
            >
                <FiX size={16} />
            </button>

            {!toast.isExiting && !isPaused && (
                <div
                    className={styles.progress}
                    style={{ animationDuration: `${TOAST_DURATION}ms` }}
                />
            )}
        </div>
    );
});

ToastItem.displayName = 'ToastItem';

export default function Toast() {
    const [toasts, setToasts] = useState<ToastItemData[]>([]);
    const lastMessage = useCartStore((state) => state.lastMessage);
    const clearMessage = useCartStore((state) => state.clearMessage);

    useEffect(() => {
        if (lastMessage && lastMessage.timestamp) {
            const id = `${lastMessage.timestamp}-${Math.random().toString(36).substr(2, 9)}`;

            setToasts((prev) => {
                // Prevent duplicate toasts if necessary, generally just add new one
                // Limit to max 5 toasts to prevent flooding
                const newToasts = [...prev, { ...lastMessage, id, isExiting: false }];
                if (newToasts.length > 5) {
                    return newToasts.slice(newToasts.length - 5);
                }
                return newToasts;
            });

            // Clear the message from store so we don't re-process it
            clearMessage();
        }
    }, [lastMessage, clearMessage]);

    const dismissToast = (id: string) => {
        setToasts((prev) =>
            prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
        );

        // Remove from DOM after animation
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 300); // Match CSS animation duration
    };

    if (toasts.length === 0) return null;

    return (
        <div className={styles.container}>
            {toasts.map((toast) => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    onDismiss={dismissToast}
                />
            ))}
        </div>
    );
}
