import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISystemSettings extends Document {
    // General
    siteName: string;
    siteDescription: string;
    contactEmail: string;
    supportPhone: string;

    // Status
    maintenanceMode: boolean;
    maintenanceMessage: string;

    // Payment
    currency: string;
    currencySymbol: string;
    paystackEnabled: boolean;

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

    // Payment
    currency: {
        type: String,
        default: 'NGN',
    },
    currencySymbol: {
        type: String,
        default: '₦',
    },
    paystackEnabled: {
        type: Boolean,
        default: true,
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
