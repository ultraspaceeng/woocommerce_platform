import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Order from '@/lib/models/order';
import { requireAdmin } from '@/lib/auth/require-admin';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/orders/[id] - Get single order by ID
export async function GET(request: Request, { params }: RouteParams) {
    try {
        await connectDB();
        const { id } = await params;

        const order = await Order.findById(id).lean();

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
    } catch (error) {
        console.error('Error fetching order:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch order' },
            { status: 500 }
        );
    }
}

// PATCH /api/orders/[id] - Update order status (Admin only)
export async function PATCH(request: Request, { params }: RouteParams) {
    const authError = requireAdmin(request);
    if (authError) return authError;

    try {
        await connectDB();
        const { id } = await params;

        const body = await request.json();
        const { paymentStatus, fulfillmentStatus, notes } = body;

        const updateFields: Record<string, string> = {};

        if (paymentStatus) updateFields.paymentStatus = paymentStatus;
        if (fulfillmentStatus) updateFields.fulfillmentStatus = fulfillmentStatus;
        if (notes !== undefined) updateFields.notes = notes;

        const order = await Order.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).lean();

        if (!order) {
            return NextResponse.json(
                { success: false, error: 'Order not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: order,
            message: 'Order updated successfully',
        });
    } catch (error) {
        console.error('Error updating order:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update order' },
            { status: 500 }
        );
    }
}
