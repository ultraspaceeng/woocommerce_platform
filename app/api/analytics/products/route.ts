import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Product from '@/lib/models/product';
import { requireAdmin } from '@/lib/auth/require-admin';

/**
 * GET /api/analytics/products
 * Get product analytics data - top performing products by revenue, views, sales
 * Admin only
 */
export async function GET(request: Request) {
    const authError = requireAdmin(request);
    if (authError) return authError;

    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const sortBy = searchParams.get('sortBy') || 'totalSales'; // totalSales, totalViews, totalSolds, totalDownloads
        const limit = parseInt(searchParams.get('limit') || '20');
        const type = searchParams.get('type'); // 'physical', 'digital', or undefined for all

        // Build query
        const query: Record<string, unknown> = { isActive: true };
        if (type) {
            query.type = type;
        }

        // Fetch products sorted by the specified metric
        const sortOption: Record<string, -1> = { [sortBy]: -1 };

        const products = await Product.find(query)
            .select('title slug type price discountedPrice totalViews totalSolds totalDownloads totalSales assets')
            .sort(sortOption)
            .limit(limit)
            .lean();

        // Calculate totals
        const totals = await Product.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalSales' },
                    totalViews: { $sum: '$totalViews' },
                    totalPhysicalSold: {
                        $sum: { $cond: [{ $eq: ['$type', 'physical'] }, '$totalSolds', 0] }
                    },
                    totalDigitalDownloads: {
                        $sum: { $cond: [{ $eq: ['$type', 'digital'] }, '$totalDownloads', 0] }
                    },
                    productCount: { $sum: 1 }
                }
            }
        ]);

        // Get top performers by each metric
        const [topByRevenue, topByViews] = await Promise.all([
            Product.find({ isActive: true })
                .select('title totalSales type')
                .sort({ totalSales: -1 })
                .limit(5)
                .lean(),
            Product.find({ isActive: true })
                .select('title totalViews type')
                .sort({ totalViews: -1 })
                .limit(5)
                .lean()
        ]);

        return NextResponse.json({
            success: true,
            data: {
                products,
                totals: totals[0] || {
                    totalRevenue: 0,
                    totalViews: 0,
                    totalPhysicalSold: 0,
                    totalDigitalDownloads: 0,
                    productCount: 0
                },
                topByRevenue,
                topByViews
            }
        });
    } catch (error) {
        console.error('Error fetching product analytics:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch product analytics' },
            { status: 500 }
        );
    }
}
