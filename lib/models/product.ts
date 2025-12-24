import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProductOption {
    name: string;
    values: string[];
}

export interface IProductInventory {
    sku?: string;
    stock: number;
    weight?: number;
}

export interface IProductSeoData {
    metaTitle: string;
    metaDescription: string;
}

export interface IProduct extends Document {
    title: string;
    slug: string;
    description: string;
    price: number;
    discountedPrice?: number;
    type: 'physical' | 'digital';
    category: string;
    options: IProductOption[];
    inventory: IProductInventory;
    assets: string[];
    videoUrl?: string;
    digitalFile?: string;
    digitalFileName?: string;
    demoLink?: string;
    brand?: string;
    seoData: IProductSeoData;
    isActive: boolean;
    rating: number; // Average rating 0-5
    ratingCount: number; // Number of ratings
    totalViews: number; // View count when product page is opened
    totalSolds: number; // Units sold (physical products)
    totalDownloads: number; // Purchase count (digital products)
    totalSales: number; // Total revenue from this product (for admin)
    createdAt: Date;
    updatedAt: Date;
}

const ProductOptionSchema = new Schema<IProductOption>({
    name: { type: String, required: true },
    values: [{ type: String }],
}, { _id: false });

const ProductInventorySchema = new Schema<IProductInventory>({
    sku: { type: String, default: '' },
    stock: { type: Number, default: 0 },
    weight: { type: Number },
}, { _id: false });

const ProductSeoDataSchema = new Schema<IProductSeoData>({
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
}, { _id: false });

const ProductSchema = new Schema<IProduct>({
    title: {
        type: String,
        required: [true, 'Product title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    description: {
        type: String,
        default: '',
    },
    price: {
        type: Number,
        required: [true, 'Product price is required'],
        min: [0, 'Price cannot be negative'],
    },
    discountedPrice: {
        type: Number,
        min: [0, 'Discounted price cannot be negative'],
    },
    type: {
        type: String,
        enum: ['physical', 'digital'],
        default: 'physical',
    },
    category: {
        type: String,
        default: 'general',
    },
    options: [ProductOptionSchema],
    inventory: {
        type: ProductInventorySchema,
        default: { sku: '', stock: 0 },
    },
    assets: [{ type: String }],
    videoUrl: { type: String },
    digitalFile: { type: String },
    digitalFileName: { type: String },
    demoLink: { type: String },
    brand: { type: String },
    seoData: {
        type: ProductSeoDataSchema,
        default: { metaTitle: '', metaDescription: '' },
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    ratingCount: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalViews: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalSolds: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalDownloads: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalSales: {
        type: Number,
        default: 0,
        min: 0,
    },
}, {
    timestamps: true,
});

// Create slug from title before saving
ProductSchema.pre('save', async function () {
    if (this.isModified('title') && !this.slug) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
});

// Index for search
ProductSchema.index({ title: 'text', description: 'text' });
ProductSchema.index({ category: 1, type: 1, price: 1 });

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
