import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/models/user';
import { requireAdmin } from '@/lib/auth/require-admin';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/users/[id] - Get single user
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        await connectDB();

        const user = await User.findById(id).lean();

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: user,
        });
    } catch (error) {
        console.error('User GET error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch user' },
            { status: 500 }
        );
    }
}

// PUT /api/users/[id] - Update user
export async function PUT(request: Request, { params }: RouteParams) {
    const authError = requireAdmin(request);
    if (authError) return authError;

    try {
        const { id } = await params;
        await connectDB();

        const body = await request.json();

        const user = await User.findByIdAndUpdate(
            id,
            body,
            { new: true, runValidators: true }
        ).lean();

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: user,
        });
    } catch (error) {
        console.error('User PUT error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update user' },
            { status: 500 }
        );
    }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(request: Request, { params }: RouteParams) {
    const authError = requireAdmin(request);
    if (authError) return authError;

    try {
        const { id } = await params;
        await connectDB();

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'User deleted successfully',
        });
    } catch (error) {
        console.error('User DELETE error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete user' },
            { status: 500 }
        );
    }
}
