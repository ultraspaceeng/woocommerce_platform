import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Order from '@/lib/models/order';
import Product from '@/lib/models/product';
import Analytics from '@/lib/models/analytics';
import JSZip from 'jszip';

interface RouteParams {
    params: Promise<{
        orderId: string;
    }>;
}

/**
 * Download All Digital Products as ZIP
 * 
 * This endpoint bundles all digital products from an order into a single ZIP file
 * for convenient download when a user has purchased multiple digital items.
 */
export async function GET(request: Request, { params }: RouteParams) {
    try {
        await connectDB();
        const { orderId } = await params;

        // 1. Verify Order Exists and is Paid
        const order = await Order.findOne({
            orderId: orderId,
            paymentStatus: { $in: ['paid', 'processing', 'fulfilled', 'shipped'] }
        });

        if (!order) {
            return NextResponse.json(
                { success: false, error: 'Order not found or not paid' },
                { status: 404 }
            );
        }

        // 2. Get all digital product IDs from the order
        const digitalProductIds = order.cartItems
            .filter((item: any) => item.type === 'digital')
            .map((item: any) => item.productId.toString());

        if (digitalProductIds.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No digital products in this order' },
                { status: 404 }
            );
        }

        // 3. Fetch all digital products
        const products = await Product.find({
            _id: { $in: digitalProductIds },
            type: 'digital',
            digitalFile: { $exists: true, $ne: null }
        });

        if (products.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No digital files available for download' },
                { status: 404 }
            );
        }

        // 4. Create ZIP archive
        const zip = new JSZip();
        const addedFiles = new Set<string>();

        for (const product of products) {
            if (!product.digitalFile) continue;

            // Decode Base64 file data
            const fileData = product.digitalFile.split(';base64,').pop();
            if (!fileData) continue;

            const buffer = Buffer.from(fileData, 'base64');
            let filename = product.digitalFileName || `${product.title.replace(/[^a-zA-Z0-9\s]/g, '')}.file`;

            // Handle duplicate filenames by appending a number
            let uniqueFilename = filename;
            let counter = 1;
            while (addedFiles.has(uniqueFilename)) {
                const ext = filename.lastIndexOf('.') > 0 ? filename.substring(filename.lastIndexOf('.')) : '';
                const base = filename.lastIndexOf('.') > 0 ? filename.substring(0, filename.lastIndexOf('.')) : filename;
                uniqueFilename = `${base}_${counter}${ext}`;
                counter++;
            }
            addedFiles.add(uniqueFilename);

            zip.file(uniqueFilename, buffer);
        }

        // 5. Generate ZIP buffer
        const zipBuffer:any = await zip.generateAsync({
            type: 'nodebuffer',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });

        // 6. Track downloads asynchronously (don't block response)
        const today = new Date().toISOString().split('T')[0];
        Promise.all([
            // Track each file download individually
            ...products.map((product: any) =>
                Analytics.findOneAndUpdate(
                    { date: today },
                    { $inc: { downloads: 1 } },
                    { upsert: true }
                ).catch(err => console.error('Download tracking failed:', err))
            ),
            // Update product download counts
            ...products.map((product: any) =>
                Product.findByIdAndUpdate(
                    product._id,
                    { $inc: { downloads: 1 } }
                ).catch(err => console.error('Product download count update failed:', err))
            )
        ]).catch(err => console.error('Bulk download tracking failed:', err));

        // 7. Return ZIP file
        const zipFilename = `order_${orderId}_digital_products.zip`;

        return new NextResponse(zipBuffer, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${zipFilename}"`,
                'Content-Length': zipBuffer.length.toString(),
            },
        });

    } catch (error) {
        console.error('Bulk download error:', error);
        return NextResponse.json(
            { success: false, error: 'Download failed' },
            { status: 500 }
        );
    }
}
