import mongoose, { Schema, Document, Model } from 'mongoose';

export type NotificationType = 
    | 'new_order' 
    | 'order_shipped' 
    | 'order_delivered' 
    | 'low_stock' 
    | 'new_review' 
    | 'system';

export interface INotification extends Document {
    type: NotificationType;
    title: string;
    message: string;
    data?: {
        orderId?: string;
        productId?: string;
        userId?: string;
        reviewId?: string;
        [key: string]: unknown;
    };
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
    type: {
        type: String,
        enum: ['new_order', 'order_shipped', 'order_delivered', 'low_stock', 'new_review', 'system'],
        required: true,
    },
    title: {
        type: String,
        required: [true, 'Notification title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    message: {
        type: String,
        required: [true, 'Notification message is required'],
        trim: true,
        maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    data: {
        type: Schema.Types.Mixed,
        default: {},
    },
    isRead: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

// Index for efficient querying
NotificationSchema.index({ isRead: 1, createdAt: -1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ createdAt: -1 });

const Notification: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
