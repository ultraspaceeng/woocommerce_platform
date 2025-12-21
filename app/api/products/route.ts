import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Product from '@/lib/models/product';
import { requireAdmin } from '@/lib/auth/require-admin';
import { sendNewProductNotification } from '@/lib/services/push';

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
        const brand = searchParams.get('brand');

        const status = searchParams.get('status');

        // Build query
        const query: Record<string, unknown> = {};

        // Status filter (default to active if not specified)
        if (status === 'all') {
            // No status filter - show all
        } else if (status === 'draft') {
            query.isActive = false;
        } else {
            // Default: show only active products
            query.isActive = true;
        }

        if (search) {
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

        if (brand && brand !== 'all') {
            query.brand = brand;
        }

        if (minPrice || maxPrice) {
            const min = minPrice ? parseFloat(minPrice) : 0;
            const max = maxPrice ? parseFloat(maxPrice) : Number.MAX_VALUE;

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

        // Sorting
        let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
        switch (sort) {
            case 'oldest':
                sortOption = { createdAt: 1 };
                break;
            case 'price_asc':
            case 'price-asc':
                sortOption = { price: 1 };
                break;
            case 'price_desc':
            case 'price-desc':
                sortOption = { price: -1 };
                break;
            case 'name-asc':
                sortOption = { title: 1 };
                break;
            case 'name-desc':
                sortOption = { title: -1 };
                break;
        }

        const skip = (page - 1) * limit;

        const [products, total] = await Promise.all([
            Product.find(query)
                .sort(sortOption)
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

        // Send push notification to all subscribed visitors
        const displayPrice = body.discountedPrice && body.discountedPrice < body.price
            ? body.discountedPrice
            : body.price;
        sendNewProductNotification(body.title, slug, displayPrice).catch(console.error);

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
