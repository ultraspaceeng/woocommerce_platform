import { NextResponse } from 'next/server';
import { saveSubscription, removeSubscription, checkSubscription } from '@/lib/services/push';

// POST /api/push/subscribe - Save push subscription
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { subscription, type = 'visitor', userId } = body;

        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return NextResponse.json(
                { success: false, error: 'Missing or invalid subscription data' },
                { status: 400 }
            );
        }

        // Validate type
        if (type !== 'admin' && type !== 'visitor') {
            return NextResponse.json(
                { success: false, error: 'Invalid subscription type' },
                { status: 400 }
            );
        }

        const saved = await saveSubscription(subscription, type, userId);

        if (saved) {
            return NextResponse.json({
                success: true,
                message: `Push subscription saved for ${type}`,
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
        const body = await request.json();
        const { endpoint } = body;

        if (!endpoint) {
            return NextResponse.json(
                { success: false, error: 'Missing endpoint' },
                { status: 400 }
            );
        }

        await removeSubscription(endpoint);

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

// GET /api/push/subscribe - Check subscription status
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const endpoint = searchParams.get('endpoint');

        if (!endpoint) {
            return NextResponse.json(
                { success: false, error: 'Missing endpoint' },
                { status: 400 }
            );
        }

        const isSubscribed = await checkSubscription(endpoint);

        return NextResponse.json({
            success: true,
            isSubscribed,
        });
    } catch (error) {
        console.error('Check subscription error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to check subscription' },
            { status: 500 }
        );
    }
}
