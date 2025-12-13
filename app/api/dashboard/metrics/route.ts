import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Order from '@/lib/models/order';
import User from '@/lib/models/user';

// GET /api/dashboard/metrics - Get dashboard metrics (Admin only)
export async function GET() {
    try {
        await connectDB();

        // TODO: Add admin auth verification

        // Get date range for weekly data
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Aggregate metrics
        const [
            totalOrders,
            ordersFulfilled,
            ordersUnfulfilled,
            totalUsers,
            revenueAgg,
            weeklySalesAgg,
        ] = await Promise.all([
            Order.countDocuments({ paymentStatus: 'paid' }),
            Order.countDocuments({ fulfillmentStatus: 'fulfilled', paymentStatus: 'paid' }),
            Order.countDocuments({ fulfillmentStatus: { $ne: 'fulfilled' }, paymentStatus: 'paid' }),
            User.countDocuments(),
            Order.aggregate([
                { $match: { paymentStatus: 'paid' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } },
            ]),
            Order.aggregate([
                {
                    $match: {
                        paymentStatus: 'paid',
                        createdAt: { $gte: weekAgo },
                    },
                },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        amount: { $sum: '$totalAmount' },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
        ]);

        const netSales = revenueAgg[0]?.total || 0;

        // Format weekly sales
        const weeklySales = weeklySalesAgg.map((item: { _id: string; amount: number }) => ({
            date: item._id,
            amount: item.amount,
        }));

        return NextResponse.json({
            success: true,
            data: {
                netSales,
                totalOrders,
                ordersFulfilled,
                ordersUnfulfilled,
                totalUsers,
                weeklySales,
            },
        });
    } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch metrics' },
            { status: 500 }
        );
    }
}
