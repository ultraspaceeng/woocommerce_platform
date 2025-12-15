import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Analytics from '@/lib/models/analytics';

export async function POST(request: Request) {
    try {
        await connectDB();
        const { type } = await request.json();

        if (type !== 'view' && type !== 'download') {
            return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
        }

        const today = new Date().toISOString().split('T')[0];

        const update: any = {};
        if (type === 'view') {
            update.$inc = { views: 1 };
        } else if (type === 'download') {
            update.$inc = { downloads: 1 };
        }

        await Analytics.findOneAndUpdate(
            { date: today },
            update,
            { upsert: true, new: true }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Analytics tracking error:', error);
        return NextResponse.json({ success: false, error: 'Tracking failed' }, { status: 500 });
    }
}
