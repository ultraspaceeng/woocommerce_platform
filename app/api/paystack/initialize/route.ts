import { NextResponse } from 'next/server';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';

// POST /api/paystack/initialize - Initialize Paystack payment
export async function POST(request: Request) {
    try {
        const { email, amount, orderId, callbackUrl } = await request.json();

        if (!email || !amount || !orderId) {
            return NextResponse.json(
                { success: false, error: 'Email, amount, and orderId are required' },
                { status: 400 }
            );
        }

        // Initialize transaction with Paystack
        const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                amount: Math.round(amount * 100), // Paystack expects amount in kobo
                callback_url: callbackUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/verify`,
                metadata: {
                    orderId,
                },
            }),
        });

        const data = await response.json();

        if (!data.status) {
            return NextResponse.json(
                { success: false, error: data.message || 'Payment initialization failed' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                authorizationUrl: data.data.authorization_url,
                accessCode: data.data.access_code,
                reference: data.data.reference,
            },
        });
    } catch (error) {
        console.error('Payment initialization error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to initialize payment' },
            { status: 500 }
        );
    }
}
