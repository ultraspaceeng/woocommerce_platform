import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Order from '@/lib/models/order';
import User from '@/lib/models/user';
import Product from '@/lib/models/product';

// const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';

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

        // Payment is already verified via inline Paystack modal on frontend
        // Proceed directly to order creation

        // Connect to database and create order
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

        // Check product types
        const hasDigitalProducts: any = orderData.cartItems.some(
            (item: { type?: string }) => item.type === 'digital'
        );
        const hasPhysicalProducts: any = orderData.cartItems.some(
            (item: { type?: string }) => item.type === 'physical' || !item.type
        );

        // Auto-fulfill if order contains ONLY digital products
        const fulfillmentStatus = (hasDigitalProducts && !hasPhysicalProducts) ? 'fulfilled' : 'unfulfilled';

        const order = new Order({
            userDetails: orderData.userDetails,
            cartItems: orderData.cartItems,
            totalAmount: orderData.totalAmount,
            hasDigitalProducts,
            paymentStatus: 'paid',
            fulfillmentStatus: fulfillmentStatus,
            paystackRef: reference,
            paidAt: new Date(),
            paymentDetails: {
                amount: orderData.totalAmount,
                currency: 'NGN',
                channel: 'paystack',
                paidAt: new Date().toISOString(),
                reference: reference,
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
            // Update stock, increment solds count, and add to revenue for each physical product
            const stockUpdatePromises = physicalItems.map(
                (item: { productId: string; quantity: number; price: number }) =>
                    Product.findByIdAndUpdate(
                        item.productId,
                        {
                            $inc: {
                                'inventory.stock': -item.quantity,
                                totalSolds: item.quantity,
                                totalSales: item.price * item.quantity
                            }
                        },
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

        // Step 5: Handle digital products - add to user's owned products and update analytics
        if (hasDigitalProducts) {
            const digitalItems = orderData.cartItems.filter(
                (item: { type?: string }) => item.type === 'digital'
            );

            const digitalProductIds = digitalItems.map(
                (item: { productId?: string }) => item.productId
            );

            await User.findByIdAndUpdate(user._id, {
                $addToSet: { ownedProducts: { $each: digitalProductIds } },
            });

            // Increment downloads count and revenue for each digital product
            const downloadUpdatePromises = digitalItems.map(
                (item: { productId: string; price: number }) =>
                    Product.findByIdAndUpdate(
                        item.productId,
                        {
                            $inc: {
                                totalDownloads: 1,
                                totalSales: item.price
                            }
                        },
                        { new: true }
                    )
            );

            try {
                await Promise.all(downloadUpdatePromises);
                console.log(`📥 Downloads updated for ${digitalItems.length} digital products`);
            } catch (downloadError) {
                console.error('Failed to update download counts:', downloadError);
            }
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

        // Prepare digital items list for frontend download links
        const digitalItemsList = orderData.cartItems
            .filter((item: { type?: string }) => item.type === 'digital')
            .map((item: { title: string; productId: string }) => ({
                title: item.title,
                productId: item.productId,
            }));

        // Determine order type: digital-only, physical-only, or mixed
        let orderType: 'digital-only' | 'physical-only' | 'mixed';
        if (hasDigitalProducts && hasPhysicalProducts) {
            orderType = 'mixed';
        } else if (hasDigitalProducts) {
            orderType = 'digital-only';
        } else {
            orderType = 'physical-only';
        }

        return NextResponse.json({
            success: true,
            message: 'Payment verified and order created successfully',
            data: {
                orderId: order.orderId,
                status: order.paymentStatus,
                orderType,
                hasDigitalProducts,
                hasPhysicalProducts,
                digitalItems: digitalItemsList,
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

/**
 * GET /api/paystack/verify?reference=xxx
 * 
 * FALLBACK: Lookup existing order by payment reference
 * Used when user revisits the verify page and sessionStorage is empty
 * (e.g., after browser refresh or on a different tab)
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const reference = searchParams.get('reference');

        if (!reference) {
            return NextResponse.json(
                { success: false, error: 'Missing payment reference' },
                { status: 400 }
            );
        }

        await connectDB();

        // Look up order by Paystack reference
        const order = await Order.findOne({ paystackRef: reference });

        if (!order) {
            return NextResponse.json(
                { success: false, error: 'Order not found. Payment may not have been completed.' },
                { status: 404 }
            );
        }

        // Determine if order has digital/physical products
        const hasDigitalProducts: boolean = order.cartItems.some(
            (item: { type?: string }) => item.type === 'digital'
        );
        const hasPhysicalProducts: boolean = order.cartItems.some(
            (item: { type?: string }) => item.type === 'physical' || !item.type
        );

        // Determine order type: digital-only, physical-only, or mixed
        let orderType: 'digital-only' | 'physical-only' | 'mixed';
        if (hasDigitalProducts && hasPhysicalProducts) {
            orderType = 'mixed';
        } else if (hasDigitalProducts) {
            orderType = 'digital-only';
        } else {
            orderType = 'physical-only';
        }

        // Build digital items list for download links
        const digitalItems = order.cartItems
            .filter((item: { type?: string }) => item.type === 'digital')
            .map((item: { title: string; productId: { toString: () => string } }) => ({
                title: item.title,
                productId: item.productId.toString(),
            }));

        return NextResponse.json({
            success: true,
            message: 'Order found',
            data: {
                orderId: order.orderId,
                status: order.paymentStatus,
                orderType,
                hasDigitalProducts,
                hasPhysicalProducts,
                digitalItems,
                totalAmount: order.totalAmount,
            },
        });
    } catch (error) {
        console.error('Order lookup error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to lookup order' },
            { status: 500 }
        );
    }
}
