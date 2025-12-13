import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Order from '@/lib/models/order';
import User from '@/lib/models/user';

// GET /api/orders - Get all orders (Admin) or single order by orderId (Public)
export async function GET(request: Request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');
        const status = searchParams.get('status');
        const fulfillment = searchParams.get('fulfillment');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        // If orderId is provided, return single order (public tracking)
        if (orderId) {
            const order = await Order.findOne({ orderId }).lean();

            if (!order) {
                return NextResponse.json(
                    { success: false, error: 'Order not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                data: order,
            });
        }

        // Otherwise return all orders (admin only - TODO: add auth)
        const query: Record<string, unknown> = {};

        if (status && status !== 'all') {
            query.paymentStatus = status;
        }

        if (fulfillment && fulfillment !== 'all') {
            query.fulfillmentStatus = fulfillment;
        }

        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments(query),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                orders,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}

// POST /api/orders - Create new order
export async function POST(request: Request) {
    try {
        await connectDB();

        const body = await request.json();
        const { userDetails, cartItems, totalAmount } = body;

        // Validate required fields
        if (!userDetails || !cartItems || !totalAmount) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Create or update user
        let user = await User.findOne({ email: userDetails.email });

        if (!user) {
            user = new User({
                email: userDetails.email,
                name: userDetails.name,
                phone: userDetails.phone,
                orderHistory: [],
            });
        }

        // Create order
        const order = new Order({
            userDetails,
            cartItems,
            totalAmount,
            paymentStatus: 'pending',
            fulfillmentStatus: 'unfulfilled',
        });

        await order.save();

        // Add order to user's history
        user.orderHistory.push(order._id);
        await user.save();

        // TODO: Initialize Paystack payment here
        // For now, return order with pending status

        return NextResponse.json({
            success: true,
            data: {
                order,
                // paymentUrl: will be added when Paystack is integrated
            },
            message: 'Order created successfully',
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating order:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create order' },
            { status: 500 }
        );
    }
}
