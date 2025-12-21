import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Product from '@/lib/models/product';
import mongoose from 'mongoose';

/**
 * GET /api/products/recommended
 * Fetches recommended products based on categories, excluding specific product IDs
 * 
 * Query params:
 * - limit: number of products to return (default: 4)
 * - excludeIds: comma-separated product IDs to exclude
 * - categories: comma-separated category IDs to prioritize
 */
export async function GET(request: Request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '4', 10);
        const excludeIdsParam = searchParams.get('excludeIds') || '';
        const categoriesParam = searchParams.get('categories') || '';

        // Parse exclude IDs
        const excludeIds = excludeIdsParam
            .split(',')
            .filter(Boolean)
            .map(id => {
                try {
                    return new mongoose.Types.ObjectId(id.trim());
                } catch {
                    return null;
                }
            })
            .filter(Boolean);

        // Parse category IDs
        const categoryIds = categoriesParam
            .split(',')
            .filter(Boolean)
            .map(id => {
                try {
                    return new mongoose.Types.ObjectId(id.trim());
                } catch {
                    return null;
                }
            })
            .filter(Boolean);

        // Build query
        const query: any = {
            status: 'published',
            'inventory.stock': { $gt: 0 },
        };

        // Exclude specific product IDs
        if (excludeIds.length > 0) {
            query._id = { $nin: excludeIds };
        }

        let products;

        // If we have categories, try to find products in those categories first
        if (categoryIds.length > 0) {
            query.category = { $in: categoryIds };
            products = await Product.find(query)
                .select('_id title slug price discountedPrice assets')
                .limit(limit)
                .sort({ totalSolds: -1, createdAt: -1 })
                .lean();

            // If we don't have enough, fill with other popular products
            if (products.length < limit) {
                const remaining = limit - products.length;
                const existingIds = [...excludeIds, ...products.map((p: any) => p._id)];

                const additionalQuery: any = {
                    status: 'published',
                    'inventory.stock': { $gt: 0 },
                    _id: { $nin: existingIds },
                };

                const additionalProducts = await Product.find(additionalQuery)
                    .select('_id title slug price discountedPrice assets')
                    .limit(remaining)
                    .sort({ totalSolds: -1, createdAt: -1 })
                    .lean();

                products = [...products, ...additionalProducts];
            }
        } else {
            // No categories specified, just get popular products
            products = await Product.find(query)
                .select('_id title slug price discountedPrice assets')
                .limit(limit)
                .sort({ totalSolds: -1, createdAt: -1 })
                .lean();
        }

        return NextResponse.json({
            success: true,
            data: products,
        });
    } catch (error) {
        console.error('Error fetching recommended products:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch recommended products' },
            { status: 500 }
        );
    }
}
