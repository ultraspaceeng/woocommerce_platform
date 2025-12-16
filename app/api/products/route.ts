import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Product from '@/lib/models/product';
import { requireAdmin } from '@/lib/auth/require-admin';

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

        const sort = searchParams.get('sort') || 'newest';

        // Build query
        const query: Record<string, unknown> = { isActive: true };

        if (search) {
            // Enhanced search across multiple fields
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { title: searchRegex },
                { description: searchRegex },
                { brand: searchRegex },
                { category: searchRegex },
                { type: searchRegex }
            ];
        }

        if (category && category !== 'all') {
            query.category = category;
        }

        if (type && type !== 'all') {
            query.type = type;
        }

        if (minPrice || maxPrice) {
            const min = minPrice ? parseFloat(minPrice) : 0;
            const max = maxPrice ? parseFloat(maxPrice) : Number.MAX_VALUE;

            // Use $expr to comparing against the effective price
            // if discountedPrice exists and > 0, use it, else use price
            query.$expr = {
                $and: [
                    {
                        $gte: [
                            { $cond: { if: { $gt: ["$discountedPrice", 0] }, then: "$discountedPrice", else: "$price" } },
                            min
                        ]
                    },
                    {
                        $lte: [
                            { $cond: { if: { $gt: ["$discountedPrice", 0] }, then: "$discountedPrice", else: "$price" } },
                            max
                        ]
                    }
                ]
            };
        }

        const brand = searchParams.get('brand');
        if (brand && brand !== 'all') {
            query.brand = brand;
        }

        const skip = (page - 1) * limit;

        // Determine sort object
        let sortQuery: any = { createdAt: -1 };
        if (sort === 'price_asc') sortQuery = { price: 1 };
        else if (sort === 'price_desc') sortQuery = { price: -1 };
        else if (sort === 'recommended') sortQuery = { isFeatured: -1, createdAt: -1 }; // Promote featured items
        else if (sort === 'newest') sortQuery = { createdAt: -1 };

        const [products, total] = await Promise.all([
            Product.find(query)
                .sort(sortQuery)
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
    const authError = requireAdmin(request);
    if (authError) return authError;

    try {
        await connectDB();

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
