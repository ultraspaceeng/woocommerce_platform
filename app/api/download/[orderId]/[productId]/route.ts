import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Order from '@/lib/models/order';
import Product from '@/lib/models/product';
import Analytics from '@/lib/models/analytics';

interface RouteParams {
    params: Promise<{
        orderId: string;
        productId: string;
    }>;
}

export async function GET(request: Request, { params }: RouteParams) {
    try {
        await connectDB();
        const { orderId, productId } = await params;

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

        // 2. Verify Product is in Order
        const isProductInOrder = order.cartItems.some(
            (item: any) => item.productId.toString() === productId
        );

        if (!isProductInOrder) {
            return NextResponse.json(
                { success: false, error: 'Product not found in this order' },
                { status: 403 }
            );
        }

        // 3. Fetch Product and Digital File
        const product = await Product.findById(productId);

        if (!product || product.type !== 'digital' || !product.digitalFile) {
            return NextResponse.json(
                { success: false, error: 'Digital content not available' },
                { status: 404 }
            );
        }

        // 4. Decode Base64 File
        const fileData = product.digitalFile.split(';base64,').pop();
        if (!fileData) {
            return NextResponse.json(
                { success: false, error: 'Invalid file data' },
                { status: 500 }
            );
        }

        // Track download asynchronously (don't block response)
        const today = new Date().toISOString().split('T')[0];
        Analytics.findOneAndUpdate(
            { date: today },
            { $inc: { downloads: 1 } },
            { upsert: true }
        ).catch(err => console.error('Download tracking failed:', err));

        const buffer = Buffer.from(fileData, 'base64');
        const filename = product.digitalFileName || 'download.file';

        // 5. Return File Stream
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': buffer.length.toString(),
            },
        });

    } catch (error) {
        console.error('Download error:', error);
        return NextResponse.json(
            { success: false, error: 'Download failed' },
            { status: 500 }
        );
    }
}
