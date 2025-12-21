import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Order from '@/lib/models/order';
import Product from '@/lib/models/product';
import { notifyOrderPlaced } from '@/lib/services/notifications';

// PayPal API credentials from environment
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox'; // 'sandbox' or 'live'

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

// POST /api/paypal/create-order - Create a PayPal order
export async function POST(request: Request) {
    try {
        if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
            return NextResponse.json(
                { success: false, error: 'PayPal is not configured' },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { amount, currency = 'USD', orderData } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json(
                { success: false, error: 'Invalid amount' },
                { status: 400 }
            );
        }

        const accessToken = await getPayPalAccessToken();

        // Create PayPal order
        const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: {
                        currency_code: currency,
                        value: amount.toFixed(2),
                    },
                    description: 'Order from Royal Commerce',
                }],
                application_context: {
                    brand_name: 'Royal Commerce',
                    landing_page: 'NO_PREFERENCE',
                    user_action: 'PAY_NOW',
                    return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/verify?provider=paypal`,
                    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout`,
                },
            }),
        });

        const paypalOrder = await response.json();

        if (paypalOrder.id) {
            return NextResponse.json({
                success: true,
                data: {
                    orderId: paypalOrder.id,
                    approvalUrl: paypalOrder.links?.find((l: any) => l.rel === 'approve')?.href,
                },
            });
        }

        console.error('PayPal order creation failed:', paypalOrder);
        return NextResponse.json(
            { success: false, error: 'Failed to create PayPal order' },
            { status: 500 }
        );
    } catch (error) {
        console.error('PayPal create order error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create PayPal order' },
            { status: 500 }
        );
    }
}
