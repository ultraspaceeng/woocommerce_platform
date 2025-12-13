import { NextResponse } from 'next/server';
import { saveSubscription, removeSubscription } from '@/lib/services/push';

// POST /api/push/subscribe - Save push subscription
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, subscription } = body;

        if (!userId || !subscription) {
            return NextResponse.json(
                { success: false, error: 'Missing userId or subscription' },
                { status: 400 }
            );
        }

        const saved = await saveSubscription(userId, subscription);

        if (saved) {
            return NextResponse.json({
                success: true,
                message: 'Push subscription saved',
            });
        } else {
            return NextResponse.json(
                { success: false, error: 'Failed to save subscription' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Push subscribe error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to subscribe' },
            { status: 500 }
        );
    }
}

// DELETE /api/push/subscribe - Remove push subscription
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Missing userId' },
                { status: 400 }
            );
        }

        await removeSubscription(userId);

        return NextResponse.json({
            success: true,
            message: 'Push subscription removed',
        });
    } catch (error) {
        console.error('Push unsubscribe error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to unsubscribe' },
            { status: 500 }
        );
    }
}
