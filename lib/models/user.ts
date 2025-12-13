import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    _id: string;
    email: string;
    name: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    orderHistory: mongoose.Types.ObjectId[];
    ownedProducts: mongoose.Types.ObjectId[]; // Digital products the user owns
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    phone: {
        type: String,
        trim: true,
    },
    address: {
        type: String,
        trim: true,
    },
    city: {
        type: String,
        trim: true,
    },
    state: {
        type: String,
        trim: true,
    },
    country: {
        type: String,
        default: 'Nigeria',
    },
    orderHistory: [{
        type: Schema.Types.ObjectId,
        ref: 'Order',
    }],
    ownedProducts: [{
        type: Schema.Types.ObjectId,
        ref: 'Product',
    }],
}, {
    timestamps: true,
});

// Indexes
UserSchema.index({ email: 1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
