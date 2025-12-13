'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import Button from '@/components/ui/button';
import { useCartStore } from '@/lib/stores/cart-store';
import styles from '../page.module.css';

function VerifyContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
    const [orderId, setOrderId] = useState('');
    const { clearCart } = useCartStore();

    useEffect(() => {
        const verifyPayment = async () => {
            const reference = searchParams.get('reference');

            if (!reference) {
                setStatus('failed');
                return;
            }

            try {
                const response = await fetch(`/api/paystack/verify?reference=${reference}`);
                const data = await response.json();

                if (data.success) {
                    setStatus('success');
                    setOrderId(data.data.orderId);
                    clearCart();
                } else {
                    setStatus('failed');
                }
            } catch {
                setStatus('failed');
            }
        };

        verifyPayment();
    }, [searchParams, clearCart]);

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
            <h2 className={styles.successTitle}>Payment Successful!</h2>
            <p className={styles.orderId}>Order ID: {orderId}</p>
            <div className={styles.successActions}>
                <Link href={`/order-tracking?orderId=${orderId}`}>
                    <Button>Track Order</Button>
                </Link>
                <Link href="/market">
                    <Button variant="secondary">Continue Shopping</Button>
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
