import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import SystemSettings from '@/lib/models/system-settings';

// GET /api/payment-settings - Get payment method settings for checkout
export async function GET() {
    try {
        await connectDB();

        const settings = await SystemSettings.findOne().lean();

        if (!settings) {
            return NextResponse.json({
                success: true,
                data: {
                    paystackEnabled: true,
                    paypalEnabled: false,
                    defaultPaymentMethod: 'paystack',
                    baseCurrency: 'NGN',
                    displayCurrency: 'NGN',
                    exchangeRate: 1,
                },
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                paystackEnabled: settings.paystackEnabled ?? true,
                paypalEnabled: settings.paypalEnabled ?? false,
                defaultPaymentMethod: settings.defaultPaymentMethod ?? 'paystack',
                baseCurrency: settings.baseCurrency ?? 'NGN',
                displayCurrency: settings.displayCurrency ?? 'NGN',
                exchangeRate: settings.exchangeRate ?? 1,
            },
        });
    } catch (error) {
        console.error('Error fetching payment settings:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch payment settings' },
            { status: 500 }
        );
    }
}
