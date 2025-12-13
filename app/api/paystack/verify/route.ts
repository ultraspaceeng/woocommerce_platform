import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Order from '@/lib/models/order';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';

// GET /api/paystack/verify?reference=xxx - Verify Paystack payment
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const reference = searchParams.get('reference');

        if (!reference) {
            return NextResponse.json(
                { success: false, error: 'Reference is required' },
                { status: 400 }
            );
        }

        // Verify transaction with Paystack
        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
        });

        const data = await response.json();

        if (!data.status || data.data.status !== 'success') {
            return NextResponse.json(
                { success: false, error: 'Payment verification failed' },
                { status: 400 }
            );
        }

        // Update order status
        await connectDB();
        const orderId = data.data.metadata?.orderId;

        if (orderId) {
            await Order.findOneAndUpdate(
                { orderId },
                {
                    paymentStatus: 'paid',
                    paystackRef: reference,
                }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                status: data.data.status,
                amount: data.data.amount / 100, // Convert from kobo
                reference: data.data.reference,
                orderId,
            },
        });
    } catch (error) {
        console.error('Payment verification error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to verify payment' },
            { status: 500 }
        );
    }
}
