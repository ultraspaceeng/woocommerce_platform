'use client';

import { useState, useEffect } from 'react';
import { FiBell, FiBellOff, FiX } from 'react-icons/fi';
import styles from './push-notification-prompt.module.css';

interface PushNotificationPromptProps {
    type?: 'admin' | 'visitor';
    showDismiss?: boolean;
}

export default function PushNotificationPrompt({
    type = 'visitor',
    showDismiss = true
}: PushNotificationPromptProps) {
    const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Check if already dismissed
        const wasDismissed = localStorage.getItem(`push-dismissed-${type}`);
        if (wasDismissed) {
            setDismissed(true);
            return;
        }

        // Check notification support
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
            setPermission('unsupported');
            return;
        }

        setPermission(Notification.permission);

        // Check if already subscribed
        checkSubscriptionStatus();

        // Show prompt after a short delay
        const timer = setTimeout(() => {
            if (Notification.permission === 'default') {
                setShowPrompt(true);
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, [type]);

    const checkSubscriptionStatus = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                // Check if this subscription is in our database
                const response = await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`);
                const data = await response.json();
                setIsSubscribed(data.isSubscribed);
            }
        } catch (error) {
            console.error('Error checking subscription:', error);
        }
    };

    const subscribeToPush = async () => {
        setLoading(true);
        try {
            // Request permission
            const permission = await Notification.requestPermission();
            setPermission(permission);

            if (permission !== 'granted') {
                setLoading(false);
                return;
            }

            // Register service worker if not already
            const registration = await navigator.serviceWorker.ready;

            // Get VAPID public key
            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!vapidPublicKey) {
                console.error('VAPID public key not configured');
                setLoading(false);
                return;
            }

            // Subscribe to push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });

            // Save to server
            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscription: subscription.toJSON(),
                    type,
                }),
            });

            if (response.ok) {
                setIsSubscribed(true);
                setShowPrompt(false);
            }
        } catch (error) {
            console.error('Error subscribing to push:', error);
        } finally {
            setLoading(false);
        }
    };

    const unsubscribeFromPush = async () => {
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                // Unsubscribe from browser
                await subscription.unsubscribe();

                // Remove from server
                await fetch('/api/push/subscribe', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: subscription.endpoint }),
                });

                setIsSubscribed(false);
            }
        } catch (error) {
            console.error('Error unsubscribing:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = () => {
        localStorage.setItem(`push-dismissed-${type}`, 'true');
        setDismissed(true);
        setShowPrompt(false);
    };

    // Helper function to convert VAPID key
    function urlBase64ToUint8Array(base64String: string) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Don't render if unsupported, dismissed, or already subscribed
    if (permission === 'unsupported' || dismissed || isSubscribed || !showPrompt) {
        return null;
    }

    // If permission denied, don't show
    if (permission === 'denied') {
        return null;
    }

    const getMessage = () => {
        if (type === 'admin') {
            return 'Enable notifications to receive alerts for new orders and important updates.';
        }
        return 'Get notified when new products drop! Never miss a deal.';
    };

    return (
        <div className={styles.prompt}>
            <div className={styles.icon}>
                <FiBell size={24} />
            </div>
            <div className={styles.content}>
                <h4 className={styles.title}>
                    {type === 'admin' ? 'Admin Notifications' : 'Stay Updated!'}
                </h4>
                <p className={styles.message}>{getMessage()}</p>
            </div>
            <div className={styles.actions}>
                <button
                    className={styles.enableBtn}
                    onClick={subscribeToPush}
                    disabled={loading}
                >
                    {loading ? 'Enabling...' : 'Enable'}
                </button>
                {showDismiss && (
                    <button
                        className={styles.dismissBtn}
                        onClick={handleDismiss}
                        aria-label="Dismiss"
                    >
                        <FiX size={18} />
                    </button>
                )}
            </div>
        </div>
    );
}

// Export a small button version for settings/toggle
export function PushNotificationToggle({ type = 'visitor' }: { type?: 'admin' | 'visitor' }) {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [supported, setSupported] = useState(true);

    useEffect(() => {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
            setSupported(false);
            return;
        }
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                const response = await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`);
                const data = await response.json();
                setIsSubscribed(data.isSubscribed);
            }
        } catch (error) {
            console.error('Error checking subscription:', error);
        }
    };

    const toggle = async () => {
        setLoading(true);
        try {
            if (isSubscribed) {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    await subscription.unsubscribe();
                    await fetch('/api/push/subscribe', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ endpoint: subscription.endpoint }),
                    });
                }
                setIsSubscribed(false);
            } else {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    setLoading(false);
                    return;
                }

                const registration = await navigator.serviceWorker.ready;
                const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

                if (!vapidPublicKey) {
                    setLoading(false);
                    return;
                }

                const padding = '='.repeat((4 - vapidPublicKey.length % 4) % 4);
                const base64 = (vapidPublicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
                const rawData = window.atob(base64);
                const outputArray = new Uint8Array(rawData.length);
                for (let i = 0; i < rawData.length; ++i) {
                    outputArray[i] = rawData.charCodeAt(i);
                }

                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: outputArray,
                });

                await fetch('/api/push/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ subscription: subscription.toJSON(), type }),
                });

                setIsSubscribed(true);
            }
        } catch (error) {
            console.error('Error toggling push:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!supported) return null;

    return (
        <button
            onClick={toggle}
            disabled={loading}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: isSubscribed ? 'var(--color-success, #22c55e)' : 'var(--color-bg-secondary)',
                color: isSubscribed ? 'white' : 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                cursor: loading ? 'wait' : 'pointer',
                opacity: loading ? 0.7 : 1,
            }}
        >
            {isSubscribed ? <FiBell size={16} /> : <FiBellOff size={16} />}
            {loading ? 'Loading...' : isSubscribed ? 'Notifications On' : 'Enable Notifications'}
        </button>
    );
}
