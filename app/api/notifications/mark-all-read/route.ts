import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Notification from '@/lib/models/notification';

// POST /api/notifications/mark-all-read - Mark all notifications as read
export async function POST() {
    try {
        await connectDB();

        const result = await Notification.updateMany(
            { isRead: false },
            { isRead: true }
        );

        return NextResponse.json({
            success: true,
            message: `Marked ${result.modifiedCount} notifications as read`,
            modifiedCount: result.modifiedCount,
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to mark notifications as read' },
            { status: 500 }
        );
    }
}
