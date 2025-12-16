import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Review from '@/lib/models/review';
import Product from '@/lib/models/product';
import Order from '@/lib/models/order';

// Helper to update product rating
async function updateProductRating(productId: string) {
    const reviews = await Review.find({ productId, isApproved: true });

    if (reviews.length === 0) {
        await Product.findByIdAndUpdate(productId, { rating: 0, ratingCount: 0 });
        return;
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / reviews.length;

    await Product.findByIdAndUpdate(productId, {
        rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        ratingCount: reviews.length,
    });
}

// GET /api/reviews?productId=xxx - Get reviews for a product
export async function GET(request: Request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');

        if (!productId) {
            return NextResponse.json(
                { success: false, error: 'Product ID is required' },
                { status: 400 }
            );
        }

        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            Review.find({ productId, isApproved: true })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Review.countDocuments({ productId, isApproved: true }),
        ]);

        // Calculate rating distribution
        const allReviews = await Review.find({ productId, isApproved: true }).select('rating');
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        allReviews.forEach(r => {
            distribution[r.rating as keyof typeof distribution]++;
        });

        return NextResponse.json({
            success: true,
            data: {
                reviews,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
                distribution,
            },
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch reviews' },
            { status: 500 }
        );
    }
}

// POST /api/reviews - Submit a review
export async function POST(request: Request) {
    try {
        await dbConnect();

        const body = await request.json();
        const { productId, customerName, customerEmail, rating, title, comment } = body;

        // Validation
        if (!productId || !customerName || !customerEmail || !rating || !comment) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json(
                { success: false, error: 'Rating must be between 1 and 5' },
                { status: 400 }
            );
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return NextResponse.json(
                { success: false, error: 'Product not found' },
                { status: 404 }
            );
        }

        // Check for existing review
        const existingReview = await Review.findOne({ productId, customerEmail });
        if (existingReview) {
            return NextResponse.json(
                { success: false, error: 'You have already reviewed this product' },
                { status: 409 }
            );
        }

        // Check if this is a verified purchase
        const hasOrdered = await Order.findOne({
            'userDetails.email': customerEmail.toLowerCase(),
            'cartItems.productId': productId,
            paymentStatus: 'paid',
        });

        // Create review
        const review = await Review.create({
            productId,
            customerName,
            customerEmail: customerEmail.toLowerCase(),
            rating,
            title,
            comment,
            isVerifiedPurchase: !!hasOrdered,
            isApproved: true, // Auto-approve
        });

        // Update product rating
        await updateProductRating(productId);

        return NextResponse.json({
            success: true,
            data: review,
            message: 'Review submitted successfully',
        }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating review:', error);

        // Handle duplicate key error
        if (error.code === 11000) {
            return NextResponse.json(
                { success: false, error: 'You have already reviewed this product' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { success: false, error: 'Failed to submit review' },
            { status: 500 }
        );
    }
}
