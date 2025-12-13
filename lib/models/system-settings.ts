import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISystemSettings extends Document {
    maintenanceMode: boolean;
    siteName: string;
    updatedAt: Date;
}

const SystemSettingsSchema = new Schema<ISystemSettings>({
    maintenanceMode: {
        type: Boolean,
        default: false,
    },
    siteName: {
        type: String,
        default: 'Royal Commerce',
    },
}, {
    timestamps: true,
});

const SystemSettings: Model<ISystemSettings> = mongoose.models.SystemSettings || mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);

export default SystemSettings;
