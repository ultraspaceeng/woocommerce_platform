// Push notification service using Web Push API
// For browser-based push notifications

import webpush from 'web-push';
import dbConnect from '@/lib/db/mongodb';
import PushSubscription from '@/lib/models/subscription';
import { formatServerPrice } from './currency-server';

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

export interface PushSubscriptionData {
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

// Save push subscription to database
export const saveSubscription = async (
    subscription: PushSubscriptionData,
    type: 'admin' | 'visitor' = 'visitor',
    userId?: string
): Promise<boolean> => {
    try {
        await dbConnect();

        // Upsert subscription (update if exists, create if not)
        await PushSubscription.findOneAndUpdate(
            { endpoint: subscription.endpoint },
            {
                endpoint: subscription.endpoint,
                keys: subscription.keys,
                type,
                userId,
            },
            { upsert: true, new: true }
        );

        console.log(`Push subscription saved (${type})`);
        return true;
    } catch (error) {
        console.error('Failed to save subscription:', error);
        return false;
    }
};

// Remove push subscription
export const removeSubscription = async (endpoint: string): Promise<boolean> => {
    try {
        await dbConnect();
        await PushSubscription.deleteOne({ endpoint });
        return true;
    } catch (error) {
        console.error('Failed to remove subscription:', error);
        return false;
    }
};

// Check if subscription exists
export const checkSubscription = async (endpoint: string): Promise<boolean> => {
    try {
        await dbConnect();
        const sub = await PushSubscription.findOne({ endpoint });
        return !!sub;
    } catch (error) {
        console.error('Failed to check subscription:', error);
        return false;
    }
};

// Send push notification to a single subscription
const sendToSubscription = async (
    subscription: PushSubscriptionData,
    payload: NotificationPayload
): Promise<boolean> => {
    try {
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
        return true;
    } catch (error) {
        console.error('Failed to send push notification:', error);
        // Remove invalid subscription
        if ((error as { statusCode?: number }).statusCode === 410) {
            await removeSubscription(subscription.endpoint);
        }
        return false;
    }
};

// Broadcast to all admin subscribers
export const broadcastToAdmins = async (
    payload: NotificationPayload
): Promise<{ success: number; failed: number }> => {
    const results = { success: 0, failed: 0 };

    try {
        await dbConnect();
        const adminSubs = await PushSubscription.find({ type: 'admin' });

        for (const sub of adminSubs) {
            const sent = await sendToSubscription(
                { endpoint: sub.endpoint, keys: sub.keys },
                payload
            );
            if (sent) results.success++;
            else results.failed++;
        }
    } catch (error) {
        console.error('Broadcast to admins error:', error);
    }

    return results;
};

// Broadcast to all visitor subscribers
export const broadcastToVisitors = async (
    payload: NotificationPayload
): Promise<{ success: number; failed: number }> => {
    const results = { success: 0, failed: 0 };

    try {
        await dbConnect();
        const visitorSubs = await PushSubscription.find({ type: 'visitor' });

        for (const sub of visitorSubs) {
            const sent = await sendToSubscription(
                { endpoint: sub.endpoint, keys: sub.keys },
                payload
            );
            if (sent) results.success++;
            else results.failed++;
        }
    } catch (error) {
        console.error('Broadcast to visitors error:', error);
    }

    return results;
};

// ===================
// ADMIN NOTIFICATIONS
// ===================

// New order notification for admin
export const sendNewOrderAdminPush = async (
    orderId: string,
    amount: number,
    customerName: string
): Promise<{ success: number; failed: number }> => {
    const formattedAmount = await formatServerPrice(amount);
    return broadcastToAdmins({
        title: '💰 New Order Received!',
        body: `Order ${orderId} - ${formattedAmount} from ${customerName}`,
        url: `/admin/orders/${orderId}`,
        tag: `admin-order-${orderId}`,
    });
};

// Payment received notification for admin
export const sendPaymentReceivedAdminPush = async (
    orderId: string,
    amount: number,
    customerName: string
): Promise<{ success: number; failed: number }> => {
    const formattedAmount = await formatServerPrice(amount);
    return broadcastToAdmins({
        title: '💳 Payment Received!',
        body: `${formattedAmount} from ${customerName} (Order: ${orderId})`,
        url: `/admin/orders/${orderId}`,
        tag: `admin-payment-${orderId}`,
    });
};

// Low stock alert for admin
export const sendLowStockAdminPush = async (
    productTitle: string,
    currentStock: number
): Promise<{ success: number; failed: number }> => {
    return broadcastToAdmins({
        title: '⚠️ Low Stock Alert!',
        body: `"${productTitle}" - Only ${currentStock} left in stock`,
        url: '/admin/products',
        tag: `admin-lowstock-${productTitle}`,
    });
};

// Order status change notification for admin
export const sendOrderStatusAdminPush = async (
    orderId: string,
    newStatus: string
): Promise<{ success: number; failed: number }> => {
    const statusEmoji: Record<string, string> = {
        'paid': '✅',
        'shipped': '🚚',
        'fulfilled': '📦',
        'failed': '❌',
    };

    return broadcastToAdmins({
        title: `${statusEmoji[newStatus] || '📋'} Order Status Updated`,
        body: `Order ${orderId} is now ${newStatus}`,
        url: `/admin/orders/${orderId}`,
        tag: `admin-status-${orderId}`,
    });
};

// =======================
// VISITOR NOTIFICATIONS
// =======================

// New product notification for visitors
export const sendNewProductNotification = async (
    productTitle: string,
    productSlug: string,
    price: number
): Promise<{ success: number; failed: number }> => {
    const formattedPrice = await formatServerPrice(price);
    return broadcastToVisitors({
        title: '🆕 New Product Alert!',
        body: `${productTitle} - ${formattedPrice} just landed!`,
        url: `/market/${productSlug}`,
        tag: `new-product-${productSlug}`,
    });
};

// Sale/discount notification for visitors
export const sendSaleNotification = async (
    productTitle: string,
    productSlug: string,
    discountPercentage: number
): Promise<{ success: number; failed: number }> => {
    return broadcastToVisitors({
        title: '🔥 Flash Sale!',
        body: `${productTitle} is now ${discountPercentage}% OFF!`,
        url: `/market/${productSlug}`,
        tag: `sale-${productSlug}`,
    });
};

export default {
    saveSubscription,
    removeSubscription,
    checkSubscription,
    broadcastToAdmins,
    broadcastToVisitors,
    sendNewOrderAdminPush,
    sendPaymentReceivedAdminPush,
    sendLowStockAdminPush,
    sendOrderStatusAdminPush,
    sendNewProductNotification,
    sendSaleNotification,
};
