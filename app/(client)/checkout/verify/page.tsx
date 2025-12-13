'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiCheckCircle, FiXCircle, FiLoader, FiMail, FiDownload, FiPackage, FiPrinter } from 'react-icons/fi';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import Button from '@/components/ui/button';
import { useCartStore } from '@/lib/stores/cart-store';
import styles from '../page.module.css';

// Digital download item from the API response
interface DigitalDownloadItem {
    title: string;
    productId: string;
}

// Order type for post-purchase messaging
type OrderType = 'digital-only' | 'physical-only' | 'mixed';

// Order data structure stored in sessionStorage by checkout page
interface StoredOrderData {
    userDetails: {
        name: string;
        email: string;
        phone: string;
        address: string;
        city: string;
        state: string;
        country: string;
    };
    cartItems: Array<{
        productId: string;
        title: string;
        type: 'physical' | 'digital';
        quantity: number;
        price: number;
        selectedOptions?: Record<string, string>;
    }>;
    totalAmount: number;
    hasDigitalProducts: boolean;
}

function VerifyContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
    const [orderId, setOrderId] = useState('');
    const [orderType, setOrderType] = useState<OrderType>('physical-only');
    const [digitalItems, setDigitalItems] = useState<DigitalDownloadItem[]>([]);
    const { clearCart } = useCartStore();

    useEffect(() => {
        const verifyPayment = async () => {
            const reference = searchParams.get('reference');

            if (!reference) {
                setStatus('failed');
                return;
            }

            try {
                // Retrieve stored order data from sessionStorage (set by checkout page before payment)
                const storedOrderData = sessionStorage.getItem('pendingOrderData');
                const storedOrderType = sessionStorage.getItem('pendingOrderType') as OrderType | null;

                let response;

                if (storedOrderData) {
                    // We have order data - make a POST request to create the order
                    const orderData: StoredOrderData = JSON.parse(storedOrderData);

                    response = await fetch('/api/paystack/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            reference,
                            orderData,
                        }),
                    });

                    // Use the stored order type (most accurate since it's from the checkout page logic)
                    if (storedOrderType) {
                        setOrderType(storedOrderType);
                    }

                    // Clean up sessionStorage after use
                    sessionStorage.removeItem('pendingOrderData');
                    sessionStorage.removeItem('pendingOrderType');
                } else {
                    // Fallback: No stored data - try GET request (order might already exist)
                    response = await fetch(`/api/paystack/verify?reference=${reference}`);
                }

                const data = await response.json();

                if (data.success) {
                    setStatus('success');
                    setOrderId(data.data.orderId);

                    // Always determine order type from API response (most accurate)
                    // The API tells us exactly what products are in the order
                    const hasDigital = data.data.hasDigitalProducts;
                    const hasPhysical = data.data.hasPhysicalProducts;

                    if (hasDigital && hasPhysical) {
                        setOrderType('mixed');
                    } else if (hasDigital) {
                        setOrderType('digital-only');
                    } else {
                        setOrderType('physical-only');
                    }

                    // Store digital items for download links
                    if (data.data.digitalItems && data.data.digitalItems.length > 0) {
                        setDigitalItems(data.data.digitalItems);
                    }

                    clearCart();
                } else {
                    setStatus('failed');
                }
            } catch (error) {
                console.error('Verification error:', error);
                setStatus('failed');
            }
        };

        verifyPayment();
    }, [searchParams, clearCart]);

    // Print Invoice Handler
    const handlePrintInvoice = () => {
        window.print();
    };

    if (status === 'loading') {
        return (
            <div className={styles.success}>
                <FiLoader className={styles.successIcon} style={{ animation: 'spin 1s linear infinite' }} />
                <h2 className={styles.successTitle}>Verifying Payment...</h2>
                <p className={styles.orderId}>Please wait while we confirm your payment.</p>
            </div>
        );
    }

    if (status === 'failed') {
        return (
            <div className={styles.success}>
                <FiXCircle className={styles.successIcon} style={{ color: 'var(--color-error)' }} />
                <h2 className={styles.successTitle}>Payment Failed</h2>
                <p className={styles.orderId}>We could not verify your payment. Please try again.</p>
                <div className={styles.successActions}>
                    <Button onClick={() => router.push('/cart')}>Return to Cart</Button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.success}>
            <FiCheckCircle className={styles.successIcon} />
            <h2 className={styles.successTitle}>Payment Successful! 🎉</h2>
            <p className={styles.orderId}>Order ID: <strong>{orderId}</strong></p>

            {/* DIGITAL-ONLY: Check email for download link + Direct download buttons */}
            {orderType === 'digital-only' && (
                <div className={styles.digitalNotice}>
                    <FiMail size={20} />
                    <div>
                        <p><strong>Check your email!</strong></p>
                        <p>Your download link has been sent to your email address. If you don&apos;t see it, check your spam folder.</p>

                        {/* Direct download links */}
                        {digitalItems.length > 0 && (
                            <div className={styles.downloadLinks}>
                                <p style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}><strong>Download your files directly:</strong></p>
                                {digitalItems.map((item, index) => (
                                    <a
                                        key={index}
                                        href={`/api/download/${orderId}/${item.productId}`}
                                        className={styles.downloadLink}
                                        download
                                    >
                                        <FiDownload size={14} />
                                        <span>{item.title}</span>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* PHYSICAL-ONLY: Print invoice for tracking ID */}
            {orderType === 'physical-only' && (
                <div className={styles.physicalNotice}>
                    <FiPackage size={20} />
                    <div>
                        <p><strong>Save Your Tracking ID</strong></p>
                        <p>Print or save this invoice as PDF to keep your tracking ID (<strong>{orderId}</strong>) for order tracking.</p>
                    </div>
                </div>
            )}

            {/* MIXED ORDER: Email for digital + Print for physical tracking */}
            {orderType === 'mixed' && (
                <>
                    <div className={styles.digitalNotice}>
                        <FiMail size={20} />
                        <div>
                            <p><strong>Digital Products</strong></p>
                            <p>Check your email for download links to your digital purchases.</p>

                            {/* Direct download links */}
                            {digitalItems.length > 0 && (
                                <div className={styles.downloadLinks}>
                                    <p style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}><strong>Download your files directly:</strong></p>
                                    {digitalItems.map((item, index) => (
                                        <a
                                            key={index}
                                            href={`/api/download/${orderId}/${item.productId}`}
                                            className={styles.downloadLink}
                                            download
                                        >
                                            <FiDownload size={14} />
                                            <span>{item.title}</span>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={styles.physicalNotice}>
                        <FiPackage size={20} />
                        <div>
                            <p><strong>Physical Products</strong></p>
                            <p>Print this invoice to save your tracking ID (<strong>{orderId}</strong>) for shipment tracking.</p>
                        </div>
                    </div>
                </>
            )}

            <div className={styles.successActions}>
                {/* Print Invoice button for physical/mixed orders */}
                {(orderType === 'physical-only' || orderType === 'mixed') && (
                    <Button onClick={handlePrintInvoice} className={styles.printButton}>
                        <FiPrinter size={16} />
                        Print Invoice
                    </Button>
                )}

                {/* Track Order button for physical/mixed orders */}
                {(orderType === 'physical-only' || orderType === 'mixed') && (
                    <Link href={`/order-tracking?orderId=${orderId}`}>
                        <Button variant="secondary">Track Order</Button>
                    </Link>
                )}

                <Link href="/market">
                    <Button variant={orderType === 'digital-only' ? 'primary' : 'secondary'}>Continue Shopping</Button>
                </Link>
            </div>
        </div>
    );
}

export default function VerifyPaymentPage() {
    return (
        <div className={styles.page}>
            <Header />
            <main className={styles.main}>
                <div className={styles.container}>
                    <Suspense fallback={<div className={styles.loading}>Loading...</div>}>
                        <VerifyContent />
                    </Suspense>
                </div>
            </main>
            <Footer />
        </div>
    );
}
