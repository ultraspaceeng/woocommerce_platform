import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import SystemSettings, { CURRENCY_SYMBOLS } from '@/lib/models/system-settings';
import { fetchExchangeRate } from '@/lib/services/currency-service';

// GET /api/exchange-rate - Get current exchange rate
export async function GET() {
    try {
        await connectDB();

        const settings = await SystemSettings.findOne().lean();

        if (!settings) {
            return NextResponse.json({
                success: true,
                data: {
                    baseCurrency: 'NGN',
                    displayCurrency: 'NGN',
                    exchangeRate: 1,
                    exchangeRateUpdatedAt: null,
                    currencySymbol: '₦',
                },
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                baseCurrency: settings.baseCurrency,
                displayCurrency: settings.displayCurrency,
                exchangeRate: settings.exchangeRate,
                exchangeRateUpdatedAt: settings.exchangeRateUpdatedAt,
                currencySymbol: settings.currencySymbol,
            },
        });
    } catch (error) {
        console.error('Error fetching exchange rate:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch exchange rate' },
            { status: 500 }
        );
    }
}

// POST /api/exchange-rate - Update exchange rate
export async function POST(request: Request) {
    try {
        await connectDB();

        const body = await request.json();
        const { displayCurrency } = body;

        if (!displayCurrency) {
            return NextResponse.json(
                { success: false, error: 'Display currency is required' },
                { status: 400 }
            );
        }

        // Get or create settings
        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = new SystemSettings();
        }

        const baseCurrency = settings.baseCurrency || 'NGN';

        // Fetch new exchange rate
        const rateResult = await fetchExchangeRate(baseCurrency, displayCurrency);

        if (!rateResult.success) {
            return NextResponse.json(
                { success: false, error: rateResult.error || 'Failed to fetch exchange rate' },
                { status: 500 }
            );
        }

        // Update settings
        settings.displayCurrency = displayCurrency;
        settings.exchangeRate = rateResult.rate;
        settings.exchangeRateUpdatedAt = new Date();
        settings.currencySymbol = CURRENCY_SYMBOLS[displayCurrency] || displayCurrency;

        await settings.save();

        return NextResponse.json({
            success: true,
            data: {
                baseCurrency,
                displayCurrency,
                exchangeRate: rateResult.rate,
                exchangeRateUpdatedAt: settings.exchangeRateUpdatedAt,
                currencySymbol: settings.currencySymbol,
            },
            message: 'Exchange rate updated successfully',
        });
    } catch (error) {
        console.error('Error updating exchange rate:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update exchange rate' },
            { status: 500 }
        );
    }
}