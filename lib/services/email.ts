import nodemailer from 'nodemailer';

// Email notification service
// Supports multiple email providers via environment configuration

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

interface OrderEmailData {
    orderId: string;
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
    downloadLinks?: Array<{
        title: string;
        url: string;
    }>;
}

/**
 * Check if email is properly configured
 * Returns true if SMTP settings are available
 */
const isEmailConfigured = (): boolean => {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    return !!(host && user && pass);
};

// Create transporter based on environment
const createTransporter = () => {
    // Default SMTP configuration
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        // Connection timeout settings
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 5000,
        socketTimeout: 10000,
    });
};

// Send email
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
    // Check if email is configured before attempting to send
    if (!isEmailConfigured()) {
        console.warn('⚠️ Email not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in environment.');
        console.log(`📧 [SKIPPED] Would have sent email to ${options.to}: "${options.subject}"`);
        return false;
    }

    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM || '"Royal Commerce" <noreply@royalcommerce.com>',
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${options.to} (ID: ${info.messageId})`);
        return true;
    } catch (error: any) {
        // Detailed error logging for debugging
        console.error('❌ Failed to send email:', {
            to: options.to,
            subject: options.subject,
            error: error.message,
            code: error.code,
            command: error.command,
        });

        // Log common issues
        if (error.code === 'ECONNREFUSED') {
            console.error('   → SMTP server connection refused. Check SMTP_HOST and SMTP_PORT.');
        } else if (error.code === 'EAUTH') {
            console.error('   → SMTP authentication failed. Check SMTP_USER and SMTP_PASS.');
        } else if (error.code === 'ESOCKET') {
            console.error('   → Socket error. Check if SMTP_SECURE matches your port (465=true, 587=false).');
        }

        return false;
    }
};

// Order confirmation email to customer
export const sendOrderConfirmationEmail = async (order: OrderEmailData): Promise<boolean> => {
    const itemsHtml = order.items.map(item => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.title}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₦${item.price.toLocaleString()}</td>
        </tr>
    `).join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Order Confirmed! 🎉</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px;">
                <p style="margin: 0 0 16px; color: #374151; font-size: 16px;">
                    Hi ${order.customerName},
                </p>
                <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    Thank you for your order! We've received your payment and your order is now being processed.
                </p>
                
                <!-- Order ID Box -->
                <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
                    <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Order ID</p>
                    <p style="margin: 0; color: #111827; font-size: 20px; font-weight: 600;">${order.orderId}</p>
                </div>
                
                <!-- Order Items -->
                <h3 style="margin: 0 0 16px; color: #111827; font-size: 16px; font-weight: 600;">Order Summary</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                    <thead>
                        <tr style="background-color: #f9fafb;">
                            <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Item</th>
                            <th style="padding: 12px; text-align: center; font-size: 12px; text-transform: uppercase; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Qty</th>
                            <th style="padding: 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2" style="padding: 16px 12px; text-align: right; font-weight: 600; color: #111827;">Total:</td>
                            <td style="padding: 16px 12px; text-align: right; font-weight: 700; color: #6366f1; font-size: 18px;">₦${order.totalAmount.toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>
                
                ${order.shippingAddress ? `
                <!-- Shipping Address -->
                <h3 style="margin: 0 0 12px; color: #111827; font-size: 16px; font-weight: 600;">Shipping Address</h3>
                <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                    <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">
                        ${order.shippingAddress.address}<br>
                        ${order.shippingAddress.city}, ${order.shippingAddress.state}<br>
                        ${order.shippingAddress.country}
                    </p>
                </div>
                ` : ''}

                ${order.downloadLinks && order.downloadLinks.length > 0 ? `
                <!-- Digital Downloads -->
                <h3 style="margin: 0 0 12px; color: #111827; font-size: 16px; font-weight: 600;">Digital Downloads</h3>
                <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                    <p style="margin: 0 0 12px; color: #374151; font-size: 14px;">
                        Your digital products are ready for download:
                    </p>
                    ${order.downloadLinks.map(link => `
                    <div style="margin-bottom: 12px;">
                        <a href="${link.url}" style="display: block; padding: 12px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; color: #6366f1; text-decoration: none; font-weight: 500; font-size: 14px; text-align: center;">
                            Download ${link.title} ⬇️
                        </a>
                    </div>
                    `).join('')}
                    <p style="margin: 8px 0 0; color: #6b7280; font-size: 12px;">
                        Note: Download links are secure and specific to your order.
                    </p>
                </div>
                ` : ''}
                
                <!-- CTA Button -->
                <div style="text-align: center; margin-top: 32px;">
                    <a href="${process.env.NEXT_PUBLIC_BASE_URL}/order-tracking?orderId=${order.orderId}" 
                       style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 14px;">
                        Track Your Order
                    </a>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">Royal Commerce</p>
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    Questions? Reply to this email or contact support.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
    `;

    return sendEmail({
        to: order.customerEmail,
        subject: `Order Confirmed - ${order.orderId}`,
        html,
        text: `Order Confirmed!\n\nHi ${order.customerName},\n\nYour order ${order.orderId} has been confirmed.\nTotal: ₦${order.totalAmount.toLocaleString()}\n\nTrack your order: ${process.env.NEXT_PUBLIC_BASE_URL}/order-tracking?orderId=${order.orderId}`,
    });
};

// Order shipped notification
export const sendOrderShippedEmail = async (
    email: string,
    customerName: string,
    orderId: string,
    trackingNumber?: string
): Promise<boolean> => {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Your Order is On Its Way! 🚚</h1>
            </div>
            <div style="padding: 32px;">
                <p style="margin: 0 0 16px; color: #374151; font-size: 16px;">
                    Hi ${customerName},
                </p>
                <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    Great news! Your order <strong>${orderId}</strong> has been shipped and is on its way to you.
                </p>
                ${trackingNumber ? `
                <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
                    <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; text-transform: uppercase;">Tracking Number</p>
                    <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 600; font-family: monospace;">${trackingNumber}</p>
                </div>
                ` : ''}
                <div style="text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/order-tracking?orderId=${orderId}" 
                       style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 14px;">
                        Track Your Package
                    </a>
                </div>
            </div>
            <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">Royal Commerce</p>
            </div>
        </div>
    </div>
</body>
</html>
    `;

    return sendEmail({
        to: email,
        subject: `Your Order ${orderId} Has Shipped!`,
        html,
        text: `Your order ${orderId} has been shipped! ${trackingNumber ? `Tracking: ${trackingNumber}` : ''}`,
    });
};

// Admin notification for new order
export const sendNewOrderAdminNotification = async (order: OrderEmailData): Promise<boolean> => {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL;
    if (!adminEmail) {
        console.log('No admin email configured for notifications');
        return false;
    }

    const itemsList = order.items.map(item =>
        `• ${item.title} x${item.quantity} - ₦${item.price.toLocaleString()}`
    ).join('\n');

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body style="margin: 0; padding: 20px; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #111827; padding: 24px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 20px;">🔔 New Order Received</h1>
        </div>
        <div style="padding: 24px;">
            <table style="width: 100%; margin-bottom: 16px;">
                <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Order ID:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600;">${order.orderId}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Customer:</td>
                    <td style="padding: 8px 0; color: #111827;">${order.customerName}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Email:</td>
                    <td style="padding: 8px 0; color: #111827;">${order.customerEmail}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Total:</td>
                    <td style="padding: 8px 0; color: #10b981; font-weight: 700; font-size: 18px;">₦${order.totalAmount.toLocaleString()}</td>
                </tr>
            </table>
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px;">
                <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; text-transform: uppercase;">Items</p>
                <p style="margin: 0; color: #374151; font-size: 14px; white-space: pre-line;">${itemsList}</p>
            </div>
            <div style="text-align: center; margin-top: 24px;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/orders" 
                   style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 14px;">
                    View in Dashboard
                </a>
            </div>
        </div>
    </div>
</body>
</html>
    `;

    return sendEmail({
        to: adminEmail,
        subject: `💰 New Order: ${order.orderId} - ₦${order.totalAmount.toLocaleString()}`,
        html,
        text: `New order received!\n\nOrder ID: ${order.orderId}\nCustomer: ${order.customerName}\nTotal: ₦${order.totalAmount.toLocaleString()}\n\nItems:\n${itemsList}`,
    });
};

export default {
    sendEmail,
    sendOrderConfirmationEmail,
    sendOrderShippedEmail,
    sendNewOrderAdminNotification,
};
