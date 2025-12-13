import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Category from '@/lib/models/category';

// GET /api/categories - Get all categories
export async function GET() {
    try {
        await connectDB();

        const categories = await Category.find({ isActive: true })
            .sort({ name: 1 })
            .lean();

        return NextResponse.json({
            success: true,
            data: categories,
        });
    } catch (error) {
        console.error('Categories GET error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch categories' },
            { status: 500 }
        );
    }
}

// POST /api/categories - Create a new category
export async function POST(request: Request) {
    try {
        await connectDB();

        const body = await request.json();
        const { name, description, image, parent } = body;

        if (!name) {
            return NextResponse.json(
                { success: false, error: 'Category name is required' },
                { status: 400 }
            );
        }

        // Generate slug
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        // Check if slug already exists
        const existingCategory = await Category.findOne({ slug });
        if (existingCategory) {
            return NextResponse.json(
                { success: false, error: 'A category with this name already exists' },
                { status: 400 }
            );
        }

        const category = await Category.create({
            name,
            slug,
            description,
            image,
            parent: parent || null,
        });

        return NextResponse.json({
            success: true,
            data: category,
        }, { status: 201 });
    } catch (error) {
        console.error('Categories POST error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create category' },
            { status: 500 }
        );
    }
}
