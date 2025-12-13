'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FiSearch, FiCheck, FiPackage, FiTruck, FiCheckCircle } from 'react-icons/fi';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import Button from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ordersApi } from '@/lib/services/api';
import { Order } from '@/types';
import styles from './page.module.css';

const steps = [
    { key: 'unfulfilled', label: 'Order Placed', icon: FiCheck },
    { key: 'processing', label: 'Processing', icon: FiPackage },
    { key: 'shipped', label: 'Shipped', icon: FiTruck },
    { key: 'fulfilled', label: 'Delivered', icon: FiCheckCircle },
];

function OrderTrackingContent() {
    const searchParams = useSearchParams();
    const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchOrder = async (id: string) => {
        if (!id.trim()) return;
        setLoading(true);
        setError('');
        try {
            const response = await ordersApi.getAll({ orderId: id } as Parameters<typeof ordersApi.getAll>[0]);
            if (response.data.success && response.data.data) {
                setOrder(response.data.data);
            } else {
                setError('Order not found');
                setOrder(null);
            }
        } catch {
            setError('Order not found');
            setOrder(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const id = searchParams.get('orderId');
        if (id) fetchOrder(id);
    }, [searchParams]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchOrder(orderId);
    };

    const getStepStatus = (stepKey: string) => {
        if (!order) return 'pending';
        const stepOrder = ['unfulfilled', 'processing', 'shipped', 'fulfilled'];
        const currentIndex = stepOrder.indexOf(order.fulfillmentStatus);
        const stepIndex = stepOrder.indexOf(stepKey);
        if (stepIndex < currentIndex) return 'completed';
        if (stepIndex === currentIndex) return 'active';
        return 'pending';
    };

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(price);

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <>
            <h1 className={styles.title}>Track Your Order</h1>

            <form onSubmit={handleSubmit} className={styles.searchForm}>
                <h2 className={styles.searchTitle}>Enter your Order ID</h2>
                <div className={styles.searchInputWrapper}>
                    <Input
                        placeholder="e.g., RC-M5X7K2-A3B4"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                    />
                    <Button type="submit" loading={loading}><FiSearch /></Button>
                </div>
            </form>

            {loading && <div className={styles.loading}>Searching for order...</div>}
            {error && <div className={styles.error}>{error}</div>}

            {order && (
                <div className={styles.orderResult}>
                    <div className={styles.orderHeader}>
                        <div className={styles.orderInfo}>
                            <h2>Order {order.orderId}</h2>
                            <span className={styles.orderDate}>Placed on {formatDate(order.createdAt)}</span>
                        </div>
                        <span className={`${styles.statusBadge} ${styles[order.fulfillmentStatus]}`}>
                            {order.fulfillmentStatus}
                        </span>
                    </div>

                    <div className={styles.timeline}>
                        {steps.map((step) => {
                            const status = getStepStatus(step.key);
                            const Icon = step.icon;
                            return (
                                <div key={step.key} className={styles.timelineStep}>
                                    <div className={`${styles.stepCircle} ${status === 'completed' ? styles.completed : ''} ${status === 'active' ? styles.active : ''}`}>
                                        <Icon size={16} />
                                    </div>
                                    <span className={`${styles.stepLabel} ${status === 'active' ? styles.active : ''}`}>{step.label}</span>
                                </div>
                            );
                        })}
                    </div>

                    <div className={styles.orderSection}>
                        <h3>Items</h3>
                        <div className={styles.orderItems}>
                            {order.cartItems.map((item, i) => (
                                <div key={i} className={styles.orderItem}>
                                    <span>{item.productTitle} × {item.quantity}</span>
                                    <span>{formatPrice(item.price * item.quantity)}</span>
                                </div>
                            ))}
                            <div className={styles.orderTotal}>
                                <span>Total</span>
                                <span>{formatPrice(order.totalAmount)}</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.orderSection}>
                        <h3>Shipping To</h3>
                        <div className={styles.customerInfo}>
                            <p>{order.userDetails.name}<br />{order.userDetails.address}<br />{order.userDetails.city}, {order.userDetails.state}<br />{order.userDetails.country}</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default function OrderTrackingPage() {
    return (
        <div className={styles.page}>
            <Header />
            <main className={styles.main}>
                <div className={styles.container}>
                    <Suspense fallback={<div className={styles.loading}>Loading...</div>}>
                        <OrderTrackingContent />
                    </Suspense>
                </div>
            </main>
            <Footer />
        </div>
    );
}
