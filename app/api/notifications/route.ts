import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Notification from '@/lib/models/notification';

// GET /api/notifications - Fetch notifications with pagination
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const unreadOnly = searchParams.get('unread_only') === 'true';

        const skip = (page - 1) * limit;

        // Build query
        const query = unreadOnly ? { isRead: false } : {};

        // Get total counts
        const [notifications, total, unreadCount] = await Promise.all([
            limit > 0
                ? Notification.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean()
                : [],
            Notification.countDocuments(query),
            Notification.countDocuments({ isRead: false }),
        ]);

        return NextResponse.json({
            success: true,
            data: notifications,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
            unreadCount,
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch notifications' },
            { status: 500 }
        );
    }
}

// POST /api/notifications - Create a new notification (internal use)
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const body = await request.json();
        const { type, title, message, data } = body;

        if (!type || !title || !message) {
            return NextResponse.json(
                { success: false, error: 'type, title, and message are required' },
                { status: 400 }
            );
        }

        const notification = await Notification.create({
            type,
            title,
            message,
            data: data || {},
        });

        return NextResponse.json({
            success: true,
            data: notification,
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating notification:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create notification' },
            { status: 500 }
        );
    }
}
