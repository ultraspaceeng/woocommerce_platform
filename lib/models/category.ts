import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategory extends Document {
    name: string;
    slug: string;
    description?: string;
    image?: string;
    parent?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const CategorySchema: Schema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Category name is required'],
            trim: true,
            maxlength: [100, 'Category name cannot exceed 100 characters'],
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        description: {
            type: String,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        image: {
            type: String, // Base64 or URL
        },
        parent: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Generate slug from name before save
CategorySchema.pre('save', async function () {
    if (this.isModified('name') && !this.slug) {
        this.slug = (this.name as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
});

// Add index for faster queries
CategorySchema.index({ slug: 1 });
CategorySchema.index({ parent: 1 });

const Category: Model<ICategory> = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);

export default Category;
