// Unified notification service
// Combines email and push notifications for order events

import {
    sendOrderConfirmationEmail,
    sendOrderShippedEmail,
    sendNewOrderAdminNotification
} from './email';
import {
    sendNewOrderAdminPush,
    broadcastToAdmins
} from './push';
import connectDB from '@/lib/db/mongodb';
import Notification from '@/lib/models/notification';

interface OrderNotificationData {
    orderId: string;
    userId?: string;
    customerName: string;
    customerEmail: string;
    items: Array<{
        title: string;
        quantity: number;
        price: number;
    }>;
    totalAmount: number;
    shippingAddress?: {
        address: string;
        city: string;
        state: string;
        country: string;
    };
}

// Helper to format currency
const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
    }).format(amount);
};

// Send all notifications for a new order
export const notifyOrderPlaced = async (order: any): Promise<void> => {
    console.log(`Sending order notifications for ${order.orderId}`);

    // Run notifications in parallel but don't block on failures
    const notifications = [
        // Customer email
        sendOrderConfirmationEmail(order)
            .then(sent => console.log(sent ? '✓ Order confirmation email sent' : '✗ Failed to send confirmation email'))
            .catch(err => console.error('Email error:', err)),

        // Admin email notification
        sendNewOrderAdminNotification(order)
            .then(sent => console.log(sent ? '✓ Admin notification email sent' : '✗ Admin email not configured'))
            .catch(err => console.error('Admin email error:', err)),
    ];

    // Add admin push notification
    notifications.push(
        sendNewOrderAdminPush(order.orderId, order.totalAmount, order.userDetails?.name || 'Customer')
            .then(result => console.log(`✓ Admin push sent (${result.success} success, ${result.failed} failed)`))
            .catch(err => console.error('Admin push error:', err))
    );

    // Create persistent notification record
    notifications.push(
        (async () => {
            try {
                await connectDB();
                await Notification.create({
                    type: 'new_order',
                    title: 'New Order Received',
                    message: `Order ${order.orderId} placed by ${order.userDetails?.name || 'Customer'} for ${formatAmount(order.totalAmount)}`,
                    data: {
                        orderId: order.orderId,
                        customerId: order.userId,
                        amount: order.totalAmount
                    }
                });
                console.log('✓ Notification record created');
            } catch (err) {
                console.error('Failed to create notification record:', err);
            }
        })()
    );

    await Promise.allSettled(notifications);
};

// Notify when order is shipped
export const notifyOrderShipped = async (
    email: string,
    customerName: string,
    orderId: string,
    userId?: string,
    trackingNumber?: string
): Promise<void> => {
    console.log(`Sending shipped notifications for ${orderId}`);

    const notifications = [
        sendOrderShippedEmail(email, customerName, orderId, trackingNumber)
            .then(sent => console.log(sent ? '✓ Shipped email sent' : '✗ Failed to send shipped email'))
            .catch(err => console.error('Shipped email error:', err)),
    ];

    // Notify admins about shipment
    notifications.push(
        broadcastToAdmins({
            title: '🚚 Order Shipped',
            body: `Order ${orderId} has been shipped to ${customerName}`,
            url: `/admin/orders/${orderId}`,
            tag: `shipped-${orderId}`,
        })
            .then(result => console.log(`✓ Shipped push sent (${result.success} success)`))
            .catch(err => console.error('Shipped push error:', err))
    );

    await Promise.allSettled(notifications);
};

// Notify when order is delivered
export const notifyOrderDelivered = async (
    email: string,
    customerName: string,
    orderId: string,
    userId?: string
): Promise<void> => {
    console.log(`Sending delivered notifications for ${orderId}`);

    // Notify admins about delivery
    await broadcastToAdmins({
        title: '📦 Order Delivered',
        body: `Order ${orderId} has been delivered to ${customerName}`,
        url: `/admin/orders/${orderId}`,
        tag: `delivered-${orderId}`,
    })
        .then(result => console.log(`✓ Delivered push sent (${result.success} success)`))
        .catch(err => console.error('Delivered push error:', err));
};

export default {
    notifyOrderPlaced,
    notifyOrderShipped,
    notifyOrderDelivered,
};

