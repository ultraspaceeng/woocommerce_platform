import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPushSubscription extends Document {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
    type: 'admin' | 'visitor';
    userId?: string; // Optional user identifier
    createdAt: Date;
    updatedAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>({
    endpoint: {
        type: String,
        required: true,
        unique: true,
    },
    keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true },
    },
    type: {
        type: String,
        enum: ['admin', 'visitor'],
        default: 'visitor',
    },
    userId: {
        type: String,
        sparse: true,
    },
}, {
    timestamps: true,
});

// Index for efficient queries
PushSubscriptionSchema.index({ type: 1 });
PushSubscriptionSchema.index({ userId: 1 });

const PushSubscription: Model<IPushSubscription> =
    mongoose.models.PushSubscription ||
    mongoose.model<IPushSubscription>('PushSubscription', PushSubscriptionSchema);

export default PushSubscription;
