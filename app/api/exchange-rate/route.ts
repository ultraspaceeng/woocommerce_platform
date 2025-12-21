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
        const { displayCurrency, baseCurrency: newBaseCurrency } = body;

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

        // Use new base currency from request if provided, otherwise use existing
        const baseCurrency = newBaseCurrency || settings.baseCurrency || 'NGN';

        // Update base currency in settings if changed
        if (newBaseCurrency && newBaseCurrency !== settings.baseCurrency) {
            settings.baseCurrency = newBaseCurrency;
        }

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

        console.log(`Exchange rate updated: ${baseCurrency} -> ${displayCurrency} = ${rateResult.rate} (source: ${rateResult.source})`);

        return NextResponse.json({
            success: true,
            data: {
                baseCurrency,
                displayCurrency,
                exchangeRate: rateResult.rate,
                exchangeRateUpdatedAt: settings.exchangeRateUpdatedAt,
                currencySymbol: settings.currencySymbol,
                source: rateResult.source, // Show which API provided the rate
            },
            message: `Exchange rate updated from ${rateResult.source}`,
        });
    } catch (error) {
        console.error('Error updating exchange rate:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update exchange rate' },
            { status: 500 }
        );
    }
}