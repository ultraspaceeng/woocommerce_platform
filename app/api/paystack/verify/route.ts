import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Order from '@/lib/models/order';
import User from '@/lib/models/user';
import Product from '@/lib/models/product';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';

/**
 * POST /api/paystack/verify
 * 
 * UPDATED FLOW: Payment happens BEFORE order creation
 * 1. Verify payment with Paystack API
 * 2. If payment is successful, CREATE the order with 'paid' status
 * 3. Decrement stock for physical products
 * 4. Return order details to client
 * 
 * This prevents orphan orders from cancelled/failed payments
 */
export async function POST(request: Request) {
    try {
        const { reference, orderData } = await request.json();

        // Validate required fields
        if (!reference) {
            return NextResponse.json(
                { success: false, error: 'Missing payment reference' },
                { status: 400 }
            );
        }

        if (!orderData || !orderData.userDetails || !orderData.cartItems || !orderData.totalAmount) {
            return NextResponse.json(
                { success: false, error: 'Missing order data' },
                { status: 400 }
            );
        }

        // Step 1: Verify payment with Paystack API
        const verifyResponse = await fetch(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                },
            }
        );

        const verifyData = await verifyResponse.json();

        // Check if payment was successful
        if (!verifyData.status || verifyData.data.status !== 'success') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Payment verification failed. Transaction was not successful.',
                    details: verifyData.message || 'Unknown error'
                },
                { status: 400 }
            );
        }

        // Verify the amount matches what was expected (security check)
        const paidAmount = verifyData.data.amount / 100; // Convert from kobo
        if (paidAmount < orderData.totalAmount) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Payment amount mismatch. Please contact support.',
                },
                { status: 400 }
            );
        }

        // Step 2: Connect to database and create order
        await connectDB();

        // Create or find user
        let user = await User.findOne({ email: orderData.userDetails.email });

        if (!user) {
            user = new User({
                email: orderData.userDetails.email,
                name: orderData.userDetails.name,
                phone: orderData.userDetails.phone,
                orderHistory: [],
            });
        }

        // Step 3: Create order with 'paid' status (only after verified payment)
        let hasDigitalProducts: any = orderData.cartItems.some(
            (item: { type?: string }) => item.type === 'digital'
        );

        const order = new Order({
            userDetails: orderData.userDetails,
            cartItems: orderData.cartItems,
            totalAmount: orderData.totalAmount,
            hasDigitalProducts, // Track if order contains digital products
            paymentStatus: 'paid', // Order is created as PAID - payment was verified first
            fulfillmentStatus: 'unfulfilled',
            paystackRef: reference,
            paidAt: new Date(),
            paymentDetails: {
                amount: verifyData.data.amount / 100,
                currency: verifyData.data.currency,
                channel: verifyData.data.channel,
                paidAt: verifyData.data.paid_at,
                reference: verifyData.data.reference,
            },
        });

        await order.save();

        // Add order to user's history
        user.orderHistory.push(order._id);
        await user.save();

        // Step 4: Decrement stock for physical products
        const physicalItems = orderData.cartItems.filter(
            (item: { type?: string }) => item.type === 'physical' || !item.type
        );

        if (physicalItems.length > 0) {
            // Update stock for each physical product (atomic operation)
            const stockUpdatePromises = physicalItems.map(
                (item: { productId: string; quantity: number }) =>
                    Product.findByIdAndUpdate(
                        item.productId,
                        { $inc: { 'inventory.stock': -item.quantity } },
                        { new: true }
                    )
            );

            try {
                const updatedProducts = await Promise.all(stockUpdatePromises);
                console.log(`📦 Stock updated for ${updatedProducts.length} products`);

                // Log any products that went to 0 or negative (for admin alerts)
                updatedProducts.forEach((product) => {
                    if (product && product.inventory?.stock <= 0) {
                        console.warn(`⚠️ Product "${product.title}" is now out of stock!`);
                    } else if (product && product.inventory?.stock <= 5) {
                        console.warn(`⚠️ Low stock alert: "${product.title}" has only ${product.inventory.stock} left`);
                    }
                });
            } catch (stockError) {
                console.error('Failed to update stock:', stockError);
                // Don't fail the order if stock update fails, but log it
            }
        }

        // Step 4: Handle digital products - add to user's owned products
        hasDigitalProducts = orderData.cartItems.some(
            (item: { type?: string }) => item.type === 'digital'
        );

        if (hasDigitalProducts) {
            const digitalProductIds = orderData.cartItems
                .filter((item: { type?: string }) => item.type === 'digital')
                .map((item: { productId?: string }) => item.productId);

            await User.findByIdAndUpdate(user._id, {
                $addToSet: { ownedProducts: { $each: digitalProductIds } },
            });
        }

        // Generate download links if applicable
        let downloadLinks: Array<{ title: string; url: string }> = [];
        if (hasDigitalProducts) {
            const digitalItems = orderData.cartItems.filter((item: { type?: string }) => item.type === 'digital');
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

            downloadLinks = digitalItems.map((item: { title: string; productId: string }) => ({
                title: item.title,
                url: `${baseUrl}/api/download/${order.orderId}/${item.productId}`,
            }));
        }

        // Send order confirmation email
        const emailData = {
            orderId: order.orderId,
            customerName: orderData.userDetails.name,
            customerEmail: orderData.userDetails.email,
            items: orderData.cartItems,
            totalAmount: orderData.totalAmount,
            shippingAddress: orderData.userDetails,
            downloadLinks,
        };

        try {
            const { sendOrderConfirmationEmail, sendNewOrderAdminNotification } = await import('@/lib/services/email');
            await sendOrderConfirmationEmail(emailData);
            await sendNewOrderAdminNotification(emailData);
        } catch (emailError) {
            console.error('Failed to send confirmation email:', emailError);
            // Don't fail the request if email fails, but log it
        }

        return NextResponse.json({
            success: true,
            message: 'Payment verified and order created successfully',
            data: {
                orderId: order.orderId,
                status: order.paymentStatus,
                hasDigitalProducts,
                totalAmount: order.totalAmount,
            },
        });
    } catch (error) {
        console.error('Payment verification error:', error);
        return NextResponse.json(
            { success: false, error: 'Payment verification failed. Please contact support.' },
            { status: 500 }
        );
    }
}
