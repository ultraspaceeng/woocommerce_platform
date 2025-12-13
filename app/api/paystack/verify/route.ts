import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Order from '@/lib/models/order';
import User from '@/lib/models/user';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';

// POST /api/paystack/verify - Verify payment after Paystack inline popup
export async function POST(request: Request) {
    try {
        const { reference, orderId } = await request.json();

        if (!reference || !orderId) {
            return NextResponse.json(
                { success: false, error: 'Missing reference or orderId' },
                { status: 400 }
            );
        }

        // Verify with Paystack API
        const verifyResponse = await fetch(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                },
            }
        );

        const verifyData = await verifyResponse.json();

        if (!verifyData.status || verifyData.data.status !== 'success') {
            return NextResponse.json(
                { success: false, error: 'Payment verification failed' },
                { status: 400 }
            );
        }

        await connectDB();

        // Update order with payment details
        const order = await Order.findOneAndUpdate(
            { orderId },
            {
                paymentStatus: 'paid',
                paystackRef: reference,
                paidAt: new Date(),
                paymentDetails: {
                    amount: verifyData.data.amount / 100, // Convert from kobo
                    currency: verifyData.data.currency,
                    channel: verifyData.data.channel,
                    paidAt: verifyData.data.paid_at,
                    reference: verifyData.data.reference,
                },
            },
            { new: true }
        );

        if (!order) {
            return NextResponse.json(
                { success: false, error: 'Order not found' },
                { status: 404 }
            );
        }

        // Check if order contains digital products and user is authenticated
        const hasDigitalProducts = order.cartItems.some(
            (item: { type?: string }) => item.type === 'digital'
        );

        if (hasDigitalProducts && order.userId) {
            // Add digital products to user's owned products
            const digitalProductIds = order.cartItems
                .filter((item: { type?: string }) => item.type === 'digital')
                .map((item: { productId?: string }) => item.productId);

            await User.findByIdAndUpdate(order.userId, {
                $addToSet: { ownedProducts: { $each: digitalProductIds } },
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Payment verified successfully',
            data: {
                orderId: order.orderId,
                status: order.paymentStatus,
                hasDigitalProducts,
            },
        });
    } catch (error) {
        console.error('Payment verification error:', error);
        return NextResponse.json(
            { success: false, error: 'Payment verification failed' },
            { status: 500 }
        );
    }
}
