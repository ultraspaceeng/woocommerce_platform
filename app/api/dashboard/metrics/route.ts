import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Order from '@/lib/models/order';
import User from '@/lib/models/user';

export async function GET() {
    try {
        await connectDB();

        // Simple queries
        const totalOrders = await Order.countDocuments({ paymentStatus: 'paid' });
        const ordersFulfilled = await Order.countDocuments({ fulfillmentStatus: 'fulfilled', paymentStatus: 'paid' });
        const ordersUnfulfilled = await Order.countDocuments({ fulfillmentStatus: { $ne: 'fulfilled' }, paymentStatus: 'paid' });
        const totalUsers = await User.countDocuments();

        // Get total revenue
        const revenueResult = await Order.aggregate([
            { $match: { paymentStatus: 'paid' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const netSales = revenueResult[0]?.total || 0;

        // Get last 7 days of orders for chart
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentOrders = await Order.find({
            paymentStatus: 'paid',
            createdAt: { $gte: sevenDaysAgo }
        }).select('totalAmount createdAt').lean();

        // Group by date
        const salesByDate: Record<string, number> = {};
        recentOrders.forEach((order: { totalAmount: number; createdAt: Date }) => {
            const dateStr = new Date(order.createdAt).toISOString().split('T')[0];
            salesByDate[dateStr] = (salesByDate[dateStr] || 0) + order.totalAmount;
        });

        // Create array for last 7 days
        const weeklySales = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            weeklySales.push({
                date: dateStr,
                amount: salesByDate[dateStr] || 0,
                orderCount: 0
            });
        }

        const weekTotalRevenue = weeklySales.reduce((sum, d) => sum + d.amount, 0);

        return NextResponse.json({
            success: true,
            data: {
                netSales,
                totalOrders,
                ordersFulfilled,
                ordersUnfulfilled,
                totalUsers,
                weeklySales,
                weekTotalRevenue,
                weekTotalOrders: recentOrders.length,
                averageOrderValue: totalOrders > 0 ? Math.round(netSales / totalOrders) : 0
            }
        });
    } catch (error) {
        console.error('Dashboard metrics error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch metrics' }, { status: 500 });
    }
}
