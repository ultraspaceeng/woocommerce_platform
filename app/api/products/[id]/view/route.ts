import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Product from '@/lib/models/product';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * POST /api/products/[id]/view
 * Increment the view count for a product
 */
export async function POST(request: Request, { params }: RouteParams) {
    try {
        await connectDB();
        const { id } = await params;

        // Atomically increment view count
        const product = await Product.findOneAndUpdate(
            // Try to match by ID or slug
            id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id },
            { $inc: { totalViews: 1 } },
            { new: true, select: 'totalViews' }
        );

        if (!product) {
            return NextResponse.json(
                { success: false, error: 'Product not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: { totalViews: product.totalViews },
        });
    } catch (error) {
        console.error('Error tracking view:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to track view' },
            { status: 500 }
        );
    }
}
