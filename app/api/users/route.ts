import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/models/user';
import { requireAdmin } from '@/lib/auth/require-admin';

// GET /api/users - Get all users (Admin only)
export async function GET(request: Request) {
    const authError = requireAdmin(request);
    if (authError) return authError;

    try {
        await connectDB();

        const users = await User.find()
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({
            success: true,
            data: users,
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}
