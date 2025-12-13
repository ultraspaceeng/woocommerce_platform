// Push notification service using Web Push API
// For browser-based push notifications

import webpush from 'web-push';

// Configure web-push with VAPID keys
// Generate keys using: npx web-push generate-vapid-keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
        `mailto:${process.env.ADMIN_EMAIL || 'admin@royalcommerce.com'}`,
        vapidPublicKey,
        vapidPrivateKey
    );
}

export interface PushSubscription {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

export interface NotificationPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    url?: string;
    tag?: string;
}

// Store for subscriptions (in production, use database)
// This is a simple in-memory store for demonstration
const subscriptions: Map<string, PushSubscription> = new Map();

// Save push subscription
export const saveSubscription = async (userId: string, subscription: PushSubscription): Promise<boolean> => {
    try {
        subscriptions.set(userId, subscription);
        console.log(`Push subscription saved for user: ${userId}`);
        return true;
    } catch (error) {
        console.error('Failed to save subscription:', error);
        return false;
    }
};

// Remove push subscription
export const removeSubscription = async (userId: string): Promise<boolean> => {
    try {
        subscriptions.delete(userId);
        return true;
    } catch (error) {
        console.error('Failed to remove subscription:', error);
        return false;
    }
};

// Send push notification to a specific user
export const sendPushNotification = async (
    userId: string,
    payload: NotificationPayload
): Promise<boolean> => {
    try {
        const subscription = subscriptions.get(userId);

        if (!subscription) {
            console.log(`No subscription found for user: ${userId}`);
            return false;
        }

        if (!vapidPublicKey || !vapidPrivateKey) {
            console.log('VAPID keys not configured');
            return false;
        }

        const pushPayload = JSON.stringify({
            title: payload.title,
            body: payload.body,
            icon: payload.icon || '/icons/icon-192x192.png',
            badge: payload.badge || '/icons/badge-72x72.png',
            data: {
                url: payload.url || '/',
            },
            tag: payload.tag,
        });

        await webpush.sendNotification(subscription, pushPayload);
        console.log(`Push notification sent to user: ${userId}`);
        return true;
    } catch (error) {
        console.error('Failed to send push notification:', error);
        // Remove invalid subscription
        if ((error as { statusCode?: number }).statusCode === 410) {
            subscriptions.delete(userId);
        }
        return false;
    }
};

// Broadcast push notification to all subscribers
export const broadcastPushNotification = async (
    payload: NotificationPayload
): Promise<{ success: number; failed: number }> => {
    const results = { success: 0, failed: 0 };

    for (const [userId] of subscriptions) {
        const sent = await sendPushNotification(userId, payload);
        if (sent) {
            results.success++;
        } else {
            results.failed++;
        }
    }

    return results;
};

// Order-specific notifications
export const sendOrderConfirmationPush = async (
    userId: string,
    orderId: string
): Promise<boolean> => {
    return sendPushNotification(userId, {
        title: 'Order Confirmed! 🎉',
        body: `Your order ${orderId} has been confirmed and is being processed.`,
        url: `/track?orderId=${orderId}`,
        tag: `order-${orderId}`,
    });
};

export const sendOrderShippedPush = async (
    userId: string,
    orderId: string
): Promise<boolean> => {
    return sendPushNotification(userId, {
        title: 'Your Order is On Its Way! 🚚',
        body: `Order ${orderId} has been shipped. Track your package now!`,
        url: `/track?orderId=${orderId}`,
        tag: `order-${orderId}-shipped`,
    });
};

export const sendOrderDeliveredPush = async (
    userId: string,
    orderId: string
): Promise<boolean> => {
    return sendPushNotification(userId, {
        title: 'Order Delivered! 📦',
        body: `Your order ${orderId} has been delivered. Enjoy your purchase!`,
        url: `/orders/${orderId}`,
        tag: `order-${orderId}-delivered`,
    });
};

// Admin notifications
export const sendNewOrderAdminPush = async (
    orderId: string,
    amount: number
): Promise<boolean> => {
    // Send to admin user ID (you'd fetch this from config/database)
    const adminUserId = 'admin';

    return sendPushNotification(adminUserId, {
        title: '💰 New Order Received!',
        body: `Order ${orderId} - ₦${amount.toLocaleString()}`,
        url: '/admin/orders',
        tag: `admin-order-${orderId}`,
    });
};

// Low stock alert for admin
export const sendLowStockAdminPush = async (
    productTitle: string,
    currentStock: number
): Promise<boolean> => {
    const adminUserId = 'admin';

    return sendPushNotification(adminUserId, {
        title: '⚠️ Low Stock Alert!',
        body: `"${productTitle}" - Only ${currentStock} left in stock`,
        url: '/admin/products',
        tag: `admin-lowstock-${productTitle}`,
    });
};

// New user registration notification for admin
export const sendNewUserAdminPush = async (
    userEmail: string,
    userName: string
): Promise<boolean> => {
    const adminUserId = 'admin';

    return sendPushNotification(adminUserId, {
        title: '👤 New User Registered!',
        body: `${userName} (${userEmail}) just signed up`,
        url: '/admin/users',
        tag: `admin-newuser-${userEmail}`,
    });
};

// Order status change notification for admin
export const sendOrderStatusAdminPush = async (
    orderId: string,
    newStatus: string
): Promise<boolean> => {
    const adminUserId = 'admin';

    const statusEmoji: Record<string, string> = {
        'paid': '✅',
        'shipped': '🚚',
        'fulfilled': '📦',
        'failed': '❌',
    };

    return sendPushNotification(adminUserId, {
        title: `${statusEmoji[newStatus] || '📋'} Order Status Updated`,
        body: `Order ${orderId} is now ${newStatus}`,
        url: `/admin/orders/${orderId}`,
        tag: `admin-status-${orderId}`,
    });
};

// Payment received notification for admin
export const sendPaymentReceivedAdminPush = async (
    orderId: string,
    amount: number,
    customerName: string
): Promise<boolean> => {
    const adminUserId = 'admin';

    return sendPushNotification(adminUserId, {
        title: '💳 Payment Received!',
        body: `₦${amount.toLocaleString()} from ${customerName} (Order: ${orderId})`,
        url: `/admin/orders/${orderId}`,
        tag: `admin-payment-${orderId}`,
    });
};

export default {
    saveSubscription,
    removeSubscription,
    sendPushNotification,
    broadcastPushNotification,
    sendOrderConfirmationPush,
    sendOrderShippedPush,
    sendOrderDeliveredPush,
    sendNewOrderAdminPush,
    sendLowStockAdminPush,
    sendNewUserAdminPush,
    sendOrderStatusAdminPush,
    sendPaymentReceivedAdminPush,
};
