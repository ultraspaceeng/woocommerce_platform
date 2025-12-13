import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/db/mongodb';
import Order from '@/lib/models/order';
import { notifyOrderPlaced } from '@/lib/services/notifications';

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
                const { reference, metadata, customer } = event.data;
                const orderId = metadata?.orderId;

                if (orderId) {
                    // Update order status
                    const order = await Order.findOneAndUpdate(
                        { orderId },
                        {
                            paymentStatus: 'paid',
                            paystackRef: reference,
                        },
                        { new: true }
                    );

                    if (order) {
                        console.log(`Order ${orderId} marked as paid`);

                        // Send notifications (email + push)
                        try {
                            await notifyOrderPlaced({
                                orderId: order.orderId,
                                customerName: order.userDetails.name,
                                customerEmail: order.userDetails.email,
                                items: order.cartItems.map((item: { title: string; quantity: number; price: number }) => ({
                                    title: item.title,
                                    quantity: item.quantity,
                                    price: item.price,
                                })),
                                totalAmount: order.totalAmount,
                                shippingAddress: order.userDetails.address ? {
                                    address: order.userDetails.address,
                                    city: order.userDetails.city || '',
                                    state: order.userDetails.state || '',
                                    country: order.userDetails.country || 'Nigeria',
                                } : undefined,
                            });
                        } catch (notifyError) {
                            console.error('Notification error:', notifyError);
                            // Don't fail the webhook if notification fails
                        }
                    }
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
                    // Could add failed payment notification here
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
