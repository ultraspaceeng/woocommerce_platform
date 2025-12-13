import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    email: string;
    name: string;
    phone?: string;
    orderHistory: mongoose.Types.ObjectId[];
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
    orderHistory: [{
        type: Schema.Types.ObjectId,
        ref: 'Order',
    }],
}, {
    timestamps: true,
});

// Indexes
UserSchema.index({ email: 1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
