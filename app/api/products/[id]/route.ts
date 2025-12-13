import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Product from '@/lib/models/product';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/products/[id] - Get single product
export async function GET(request: Request, { params }: RouteParams) {
    try {
        await connectDB();
        const { id } = await params;

        // Try to find by ID first, then by slug
        let product = null;

        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            product = await Product.findById(id).select('-digitalFile').lean();
        }

        if (!product) {
            product = await Product.findOne({ slug: id }, { digitalFile: 0 }).lean();
        }

        if (!product) {
            return NextResponse.json(
                { success: false, error: 'Product not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: product,
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch product' },
            { status: 500 }
        );
    }
}

// PUT /api/products/[id] - Update product (Admin only)
export async function PUT(request: Request, { params }: RouteParams) {
    try {
        await connectDB();
        const { id } = await params;

        // TODO: Add admin auth verification
        const body = await request.json();

        // Note: We don't regenerate slug on update to preserve existing URLs
        // If you need to change the slug, it should be deleted and recreated

        const product = await Product.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true, runValidators: true }
        ).lean();

        if (!product) {
            return NextResponse.json(
                { success: false, error: 'Product not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: product,
            message: 'Product updated successfully',
        });
    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update product' },
            { status: 500 }
        );
    }
}

// DELETE /api/products/[id] - Delete product (Admin only)
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        await connectDB();
        const { id } = await params;

        // TODO: Add admin auth verification

        const product = await Product.findByIdAndDelete(id);

        if (!product) {
            return NextResponse.json(
                { success: false, error: 'Product not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Product deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete product' },
            { status: 500 }
        );
    }
}
