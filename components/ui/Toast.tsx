'use client';

import { useEffect, useState } from 'react';
import { useCartStore, CartMessage } from '@/lib/stores/cart-store';
import { FiCheck, FiAlertTriangle, FiX, FiShoppingCart } from 'react-icons/fi';
import styles from './Toast.module.css';

interface ToastItem extends CartMessage {
    id: string;
    isExiting: boolean;
}

export default function Toast() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const lastMessage = useCartStore((state) => state.lastMessage);
    const clearMessage = useCartStore((state) => state.clearMessage);

    useEffect(() => {
        if (lastMessage && lastMessage.timestamp) {
            const id = `${lastMessage.timestamp}-${Math.random()}`;

            // Add new toast
            setToasts((prev) => [
                ...prev,
                { ...lastMessage, id, isExiting: false },
            ]);

            // Clear the message from store
            clearMessage();

            // Auto-dismiss after 4 seconds
            const dismissTimer = setTimeout(() => {
                setToasts((prev) =>
                    prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
                );

                // Remove after animation
                setTimeout(() => {
                    setToasts((prev) => prev.filter((t) => t.id !== id));
                }, 300);
            }, 4000);

            return () => clearTimeout(dismissTimer);
        }
    }, [lastMessage?.timestamp, clearMessage]);

    const dismissToast = (id: string) => {
        setToasts((prev) =>
            prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
        );
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 300);
    };

    const getIcon = (type: CartMessage['type']) => {
        switch (type) {
            case 'success':
                return <FiCheck size={18} />;
            case 'warning':
                return <FiAlertTriangle size={18} />;
            case 'error':
                return <FiX size={18} />;
            default:
                return <FiShoppingCart size={18} />;
        }
    };

    if (toasts.length === 0) return null;

    return (
        <div className={styles.container}>
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`${styles.toast} ${styles[toast.type]} ${toast.isExiting ? styles.exiting : ''}`}
                    onClick={() => dismissToast(toast.id)}
                >
                    <div className={styles.icon}>
                        {getIcon(toast.type)}
                    </div>
                    <p className={styles.message}>{toast.message}</p>
                    <button className={styles.close} onClick={() => dismissToast(toast.id)}>
                        <FiX size={14} />
                    </button>
                </div>
            ))}
        </div>
    );
}
