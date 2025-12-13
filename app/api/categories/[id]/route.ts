import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Category from '@/lib/models/category';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/categories/[id] - Get single category
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        await connectDB();

        const category = await Category.findById(id);

        if (!category) {
            return NextResponse.json(
                { success: false, error: 'Category not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: category,
        });
    } catch (error) {
        console.error('Category GET error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch category' },
            { status: 500 }
        );
    }
}

// PUT /api/categories/[id] - Update category
export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        await connectDB();

        const body = await request.json();
        const { name, description, image, parent, isActive } = body;

        const updateData: Record<string, unknown> = {};
        if (name !== undefined) {
            updateData.name = name;
            updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }
        if (description !== undefined) updateData.description = description;
        if (image !== undefined) updateData.image = image;
        if (parent !== undefined) updateData.parent = parent || null;
        if (isActive !== undefined) updateData.isActive = isActive;

        const category = await Category.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!category) {
            return NextResponse.json(
                { success: false, error: 'Category not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: category,
        });
    } catch (error) {
        console.error('Category PUT error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update category' },
            { status: 500 }
        );
    }
}

// DELETE /api/categories/[id] - Delete category
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        await connectDB();

        const category = await Category.findByIdAndDelete(id);

        if (!category) {
            return NextResponse.json(
                { success: false, error: 'Category not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Category deleted successfully',
        });
    } catch (error) {
        console.error('Category DELETE error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete category' },
            { status: 500 }
        );
    }
}
