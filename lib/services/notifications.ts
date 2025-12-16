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

    if (userId) {
        notifications.push(
            sendOrderShippedPush(userId, orderId)
                .then(sent => console.log(sent ? '✓ Shipped push sent' : '✗ Push failed'))
                .catch(err => console.error('Shipped push error:', err))
        );
    }

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

    // For now, only send push notification for delivery
    // You can add a delivery confirmation email template later
    if (userId) {
        await sendOrderDeliveredPush(userId, orderId)
            .then(sent => console.log(sent ? '✓ Delivered push sent' : '✗ Push failed'))
            .catch(err => console.error('Delivered push error:', err));
    }
};

export default {
    notifyOrderPlaced,
    notifyOrderShipped,
    notifyOrderDelivered,
};
