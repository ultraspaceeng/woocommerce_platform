import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import SystemSettings from '@/lib/models/system-settings';

// GET /api/settings - Get system settings
export async function GET() {
    try {
        await connectDB();

        let settings = await SystemSettings.findOne().lean();

        // Create default settings if none exist
        if (!settings) {
            const newSettings = new SystemSettings({
                maintenanceMode: false,
                siteName: 'Royal Commerce',
            });
            await newSettings.save();
            settings = newSettings.toObject();
        }

        return NextResponse.json({
            success: true,
            data: settings,
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

// PUT /api/settings - Update system settings (Admin only)
export async function PUT(request: Request) {
    try {
        await connectDB();

        // TODO: Add admin auth verification
        const body = await request.json();

        let settings = await SystemSettings.findOne();

        if (!settings) {
            settings = new SystemSettings(body);
        } else {
            Object.assign(settings, body);
        }

        await settings.save();

        return NextResponse.json({
            success: true,
            data: settings,
            message: 'Settings updated successfully',
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update settings' },
            { status: 500 }
        );
    }
}
