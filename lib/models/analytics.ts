import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
    date: {
        type: String, // Format: YYYY-MM-DD
        required: true,
        unique: true,
        index: true,
    },
    views: {
        type: Number,
        default: 0,
    },
    downloads: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

export default mongoose.models.Analytics || mongoose.model('Analytics', analyticsSchema);
