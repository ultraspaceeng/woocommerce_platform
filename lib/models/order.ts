import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItem {
    productId: mongoose.Types.ObjectId;
    title: string;
    type?: 'physical' | 'digital';
    quantity: number;
    price: number;
    selectedOptions?: Record<string, string>;
    // For digital products
    digitalFile?: string;
    digitalFileName?: string;
}

export interface IUserDetails {
    name: string;
    email: string;
    phone: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
}

export interface IPaymentDetails {
    amount: number;
    currency: string;
    channel: string;
    reference: string;
    paidAt: string;
}

export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type FulfillmentStatus = 'unfulfilled' | 'processing' | 'shipped' | 'fulfilled';

export interface IOrder extends Document {
    orderId: string;
    userId?: mongoose.Types.ObjectId;
    userDetails: IUserDetails;
    cartItems: IOrderItem[];
    totalAmount: number;
    paymentStatus: PaymentStatus;
    paystackRef?: string;
    paymentDetails?: IPaymentDetails;
    paidAt?: Date;
    hasDigitalProducts: boolean;
    fulfillmentStatus: FulfillmentStatus;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    title: { type: String, required: true },
    type: { type: String, enum: ['physical', 'digital'], default: 'physical' },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1'],
    },
    price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative'],
    },
    selectedOptions: {
        type: Map,
        of: String,
    },
    digitalFile: { type: String },
    digitalFileName: { type: String },
}, { _id: false });

const UserDetailsSchema = new Schema<IUserDetails>({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
}, { _id: false });

const PaymentDetailsSchema = new Schema<IPaymentDetails>({
    amount: { type: Number, required: true },
    currency: { type: String, default: 'NGN' },
    channel: { type: String },
    reference: { type: String, required: true },
    paidAt: { type: String },
}, { _id: false });

const OrderSchema = new Schema<IOrder>({
    orderId: {
        type: String,
        unique: true,
        // Note: NOT required because it's auto-generated in pre-validate hook
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    userDetails: {
        type: UserDetailsSchema,
        required: true,
    },
    cartItems: {
        type: [OrderItemSchema],
        required: true,
        validate: {
            validator: function (items: IOrderItem[]) {
                return items.length > 0;
            },
            message: 'Order must contain at least one item',
        },
    },
    totalAmount: {
        type: Number,
        required: true,
        min: [0, 'Total amount cannot be negative'],
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending',
    },
    paystackRef: { type: String },
    paymentDetails: { type: PaymentDetailsSchema },
    paidAt: { type: Date },
    hasDigitalProducts: { type: Boolean, default: false },
    fulfillmentStatus: {
        type: String,
        enum: ['unfulfilled', 'processing', 'shipped', 'fulfilled'],
        default: 'unfulfilled',
    },
    notes: { type: String },
}, {
    timestamps: true,
});

// Generate order ID BEFORE validation runs (pre-validate hook)
// This ensures orderId is set before any validation occurs
OrderSchema.pre('validate', function () {
    if (!this.orderId) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.orderId = `RC-${timestamp}-${random}`;
    }
});

// Indexes for querying
// orderId index is already created by unique: true option in schema path
OrderSchema.index({ 'userDetails.email': 1 });
OrderSchema.index({ paymentStatus: 1, fulfillmentStatus: 1 });
OrderSchema.index({ createdAt: -1 });

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
