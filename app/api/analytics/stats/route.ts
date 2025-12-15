import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Analytics from '@/lib/models/analytics';

export async function GET() {
    try {
        await connectDB();

        // Get total stats
        const allStats = await Analytics.find({});

        const totalViews = allStats.reduce((sum, doc) => sum + (doc.views || 0), 0);
        const totalDownloads = allStats.reduce((sum, doc) => sum + (doc.downloads || 0), 0);

        // Get recent 7 days for potential chart usage
        const recentStats = await Analytics.find().sort({ date: -1 }).limit(7).lean();

        return NextResponse.json({
            success: true,
            data: {
                totalViews,
                totalDownloads,
                recentStats: recentStats.reverse()
            }
        });
    } catch (error) {
        console.error('Analytics stats fetch error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
    }
}
