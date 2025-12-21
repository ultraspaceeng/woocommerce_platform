import mongoose, { Schema, Document, Model } from 'mongoose';

// Re-export currency constants from shared module (for backward compatibility)
export { CURRENCY_SYMBOLS, SUPPORTED_CURRENCIES } from '@/lib/constants/currencies';

export interface ISystemSettings extends Document {
    // General
    siteName: string;
    siteDescription: string;
    contactEmail: string;
    supportPhone: string;

    // Status
    maintenanceMode: boolean;
    maintenanceMessage: string;

    // Payment & Currency
    baseCurrency: string; // Currency prices are stored in (NGN default)
    displayCurrency: string; // Currency to display to users
    exchangeRate: number; // Rate from base to display currency
    exchangeRateUpdatedAt: Date | null; // Last update time
    currencySymbol: string; // Display symbol
    paystackEnabled: boolean; // African market (NGN, GHS, ZAR, KES)
    paypalEnabled: boolean; // International market (USD, EUR, GBP, etc.)
    defaultPaymentMethod: 'paystack' | 'paypal' | 'both'; // Which payment methods to show

    // Shipping
    freeShippingThreshold: number;
    defaultShippingFee: number;

    // Notifications
    orderEmailNotifications: boolean;
    lowStockAlerts: boolean;
    lowStockThreshold: number;

    // Store
    storeAddress: string;
    storeCity: string;
    storeState: string;
    storeCountry: string;

    updatedAt: Date;
}

const SystemSettingsSchema = new Schema<ISystemSettings>({
    // General
    siteName: {
        type: String,
        default: 'Royal Commerce',
    },
    siteDescription: {
        type: String,
        default: 'Premium E-commerce Platform',
    },
    contactEmail: {
        type: String,
        default: '',
    },
    supportPhone: {
        type: String,
        default: '',
    },

    // Status
    maintenanceMode: {
        type: Boolean,
        default: false,
    },
    maintenanceMessage: {
        type: String,
        default: 'We are currently undergoing maintenance. Please check back soon.',
    },

    // Payment & Currency
    baseCurrency: {
        type: String,
        default: 'NGN',
    },
    displayCurrency: {
        type: String,
        default: 'NGN',
    },
    exchangeRate: {
        type: Number,
        default: 1, // 1:1 when base and display are same
    },
    exchangeRateUpdatedAt: {
        type: Date,
        default: null,
    },
    currencySymbol: {
        type: String,
        default: '₦',
    },
    paystackEnabled: {
        type: Boolean,
        default: true,
    },
    paypalEnabled: {
        type: Boolean,
        default: false,
    },
    defaultPaymentMethod: {
        type: String,
        enum: ['paystack', 'paypal', 'both'],
        default: 'paystack',
    },

    // Shipping
    freeShippingThreshold: {
        type: Number,
        default: 50000, // Free shipping over 50k
    },
    defaultShippingFee: {
        type: Number,
        default: 2500,
    },

    // Notifications
    orderEmailNotifications: {
        type: Boolean,
        default: true,
    },
    lowStockAlerts: {
        type: Boolean,
        default: true,
    },
    lowStockThreshold: {
        type: Number,
        default: 10,
    },

    // Store
    storeAddress: {
        type: String,
        default: '',
    },
    storeCity: {
        type: String,
        default: 'Lagos',
    },
    storeState: {
        type: String,
        default: 'Lagos',
    },
    storeCountry: {
        type: String,
        default: 'Nigeria',
    },
}, {
    timestamps: true,
});

const SystemSettings: Model<ISystemSettings> = mongoose.models.SystemSettings || mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);

export default SystemSettings;
