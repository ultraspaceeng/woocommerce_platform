import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Order from '@/lib/models/order';
import Product from '@/lib/models/product';
import { notifyOrderPlaced } from '@/lib/services/notifications';

// PayPal API credentials from environment
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';

const PAYPAL_API_URL = PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

// Get PayPal access token
async function getPayPalAccessToken(): Promise<string> {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

    const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });

    const data = await response.json();
    return data.access_token;
}

// Generate unique order ID
function generateOrderId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const segment1 = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const segment2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `RC-${segment1}-${segment2}`;
}

interface CartItem {
    productId: string;
    title: string;
    type: 'physical' | 'digital';
    quantity: number;
    price: number;
    selectedOptions?: Record<string, string>;
    digitalFile?: string;
    digitalFileName?: string;
}

// POST /api/paypal/capture-order - Capture PayPal payment and create order
export async function POST(request: Request) {
    try {
        if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
            return NextResponse.json(
                { success: false, error: 'PayPal is not configured' },
                { status: 500 }
            );
        }

        await connectDB();

        const body = await request.json();
        const { paypalOrderId, orderData } = body;

        if (!paypalOrderId) {
            return NextResponse.json(
                { success: false, error: 'PayPal order ID is required' },
                { status: 400 }
            );
        }

        const accessToken = await getPayPalAccessToken();

        // Capture the PayPal order
        const captureResponse = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${paypalOrderId}/capture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        const captureData = await captureResponse.json();

        if (captureData.status !== 'COMPLETED') {
            console.error('PayPal capture failed:', captureData);
            return NextResponse.json(
                { success: false, error: 'Payment capture failed' },
                { status: 400 }
            );
        }

        // Payment successful - create order in database
        const { userDetails, cartItems, totalAmount, hasDigitalProducts } = orderData;
        const orderId = generateOrderId();

        // Build cart items for order
        const cartItemsForOrder = cartItems.map((item: CartItem) => ({
            productId: item.productId,
            productTitle: item.title,
            productType: item.type,
            quantity: item.quantity,
            price: item.price,
            selectedOptions: item.selectedOptions || {},
            digitalFile: item.digitalFile,
            digitalFileName: item.digitalFileName,
        }));

        // Create order
        const order = new Order({
            orderId,
            userDetails: {
                name: userDetails.name,
                email: userDetails.email,
                phone: userDetails.phone,
                address: userDetails.address || '',
                city: userDetails.city || '',
                state: userDetails.state || '',
                country: userDetails.country || '',
            },
            cartItems: cartItemsForOrder,
            totalAmount,
            paymentStatus: 'paid',
            paymentMethod: 'paypal',
            paypalOrderId: paypalOrderId,
            paypalCaptureId: captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id,
            fulfillmentStatus: hasDigitalProducts ? 'fulfilled' : 'unfulfilled',
            orderType: hasDigitalProducts ? 'digital' : 'physical',
            hasDigitalProducts,
        });

        await order.save();

        // Update product stock and sales count
        for (const item of cartItems) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: {
                    'inventory.stock': item.type === 'physical' ? -item.quantity : 0,
                    totalSolds: item.type === 'physical' ? item.quantity : 0,
                    totalDownloads: item.type === 'digital' ? item.quantity : 0,
                    totalSales: item.price * item.quantity,
                },
            });
        }

        // Send notifications
        try {
            await notifyOrderPlaced({
                orderId,
                customerName: userDetails.name,
                customerEmail: userDetails.email,
                totalAmount,
                cartItems: cartItemsForOrder,
                hasDigitalProducts,
            });
        } catch (notifyError) {
            console.error('Notification error:', notifyError);
        }

        // Prepare digital items for response
        const digitalItems = cartItems
            .filter((item: CartItem) => item.type === 'digital')
            .map((item: CartItem) => ({
                title: item.title,
                productId: item.productId,
            }));

        return NextResponse.json({
            success: true,
            data: {
                orderId,
                hasDigitalProducts,
                hasPhysicalProducts: cartItems.some((item: CartItem) => item.type === 'physical'),
                digitalItems,
            },
        });
    } catch (error) {
        console.error('PayPal capture order error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to capture PayPal order' },
            { status: 500 }
        );
    }
}
