import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/db/mongodb';
import Order from '@/lib/models/order';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';

// POST /api/paystack/webhook - Handle Paystack webhook events
export async function POST(request: Request) {
    try {
        const body = await request.text();
        const signature = request.headers.get('x-paystack-signature');

        // Verify webhook signature
        const hash = crypto
            .createHmac('sha512', PAYSTACK_SECRET_KEY)
            .update(body)
            .digest('hex');

        if (hash !== signature) {
            console.error('Invalid Paystack signature');
            return NextResponse.json(
                { success: false, error: 'Invalid signature' },
                { status: 401 }
            );
        }

        const event = JSON.parse(body);
        console.log('Paystack webhook event:', event.event);

        await connectDB();

        // Handle different event types
        switch (event.event) {
            case 'charge.success': {
                const { reference, metadata } = event.data;
                const orderId = metadata?.orderId;

                if (orderId) {
                    await Order.findOneAndUpdate(
                        { orderId },
                        {
                            paymentStatus: 'paid',
                            paystackRef: reference,
                        }
                    );
                    console.log(`Order ${orderId} marked as paid`);

                    // TODO: Send email notification
                    // TODO: Send push notification to admin
                }
                break;
            }

            case 'charge.failed': {
                const { metadata } = event.data;
                const orderId = metadata?.orderId;

                if (orderId) {
                    await Order.findOneAndUpdate(
                        { orderId },
                        { paymentStatus: 'failed' }
                    );
                    console.log(`Order ${orderId} payment failed`);
                }
                break;
            }

            default:
                console.log(`Unhandled event: ${event.event}`);
        }

        return NextResponse.json({ success: true, received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { success: false, error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}
