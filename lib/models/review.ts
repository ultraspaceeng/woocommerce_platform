import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReview extends Document {
    productId: mongoose.Types.ObjectId;
    customerName: string;
    customerEmail: string;
    rating: number; // 1-5 stars
    title?: string;
    comment: string;
    isVerifiedPurchase: boolean;
    isApproved: boolean; // Admin moderation
    createdAt: Date;
    updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true,
    },
    customerName: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true,
        maxlength: 100,
    },
    customerEmail: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: 1,
        max: 5,
    },
    title: {
        type: String,
        trim: true,
        maxlength: 150,
    },
    comment: {
        type: String,
        required: [true, 'Review comment is required'],
        trim: true,
        maxlength: 2000,
    },
    isVerifiedPurchase: {
        type: Boolean,
        default: false,
    },
    isApproved: {
        type: Boolean,
        default: true, // Auto-approve by default, can change to false for moderation
    },
}, {
    timestamps: true,
});

// Compound index for unique review per product per email
ReviewSchema.index({ productId: 1, customerEmail: 1 }, { unique: true });

// Index for fetching approved reviews
ReviewSchema.index({ productId: 1, isApproved: 1, createdAt: -1 });

const Review: Model<IReview> =
    mongoose.models.Review ||
    mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
