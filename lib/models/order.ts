import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItem {
    product: mongoose.Types.ObjectId;
    productTitle: string;
    quantity: number;
    price: number;
    selectedOptions?: Record<string, string>;
}

export interface IUserDetails {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
}

export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type FulfillmentStatus = 'unfulfilled' | 'processing' | 'shipped' | 'fulfilled';

export interface IOrder extends Document {
    orderId: string;
    userDetails: IUserDetails;
    cartItems: IOrderItem[];
    totalAmount: number;
    paymentStatus: PaymentStatus;
    paystackRef?: string;
    fulfillmentStatus: FulfillmentStatus;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    productTitle: { type: String, required: true },
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
}, { _id: false });

const UserDetailsSchema = new Schema<IUserDetails>({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
}, { _id: false });

const OrderSchema = new Schema<IOrder>({
    orderId: {
        type: String,
        required: true,
        unique: true,
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
    fulfillmentStatus: {
        type: String,
        enum: ['unfulfilled', 'processing', 'shipped', 'fulfilled'],
        default: 'unfulfilled',
    },
    notes: { type: String },
}, {
    timestamps: true,
});

// Generate order ID before saving
OrderSchema.pre('save', async function () {
    if (!this.orderId) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.orderId = `RC-${timestamp}-${random}`;
    }
});

// Indexes for querying
OrderSchema.index({ orderId: 1 });
OrderSchema.index({ 'userDetails.email': 1 });
OrderSchema.index({ paymentStatus: 1, fulfillmentStatus: 1 });
OrderSchema.index({ createdAt: -1 });

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
