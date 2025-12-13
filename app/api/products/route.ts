import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Product from '@/lib/models/product';

// GET /api/products - Get all products with optional filters
export async function GET(request: Request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const category = searchParams.get('category');
        const type = searchParams.get('type');
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        // Build query
        const query: Record<string, unknown> = { isActive: true };

        if (search) {
            query.$text = { $search: search };
        }

        if (category && category !== 'all') {
            query.category = category;
        }

        if (type && type !== 'all') {
            query.type = type;
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) (query.price as Record<string, number>).$gte = parseFloat(minPrice);
            if (maxPrice) (query.price as Record<string, number>).$lte = parseFloat(maxPrice);
        }

        const skip = (page - 1) * limit;

        const [products, total] = await Promise.all([
            Product.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Product.countDocuments(query),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                products,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch products' },
            { status: 500 }
        );
    }
}

// POST /api/products - Create new product (Admin only)
export async function POST(request: Request) {
    try {
        await connectDB();

        // TODO: Add admin auth verification
        const body = await request.json();

        // Generate slug from title with random suffix for uniqueness
        const baseSlug = body.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        // Generate random 8-character alphanumeric suffix
        const randomSuffix = Math.random().toString(36).substring(2, 10);
        const slug = `${baseSlug}-${randomSuffix}`;

        const product = new Product({
            ...body,
            slug,
        });

        await product.save();

        return NextResponse.json({
            success: true,
            data: product,
            message: 'Product created successfully',
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create product' },
            { status: 500 }
        );
    }
}
