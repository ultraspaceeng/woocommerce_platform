'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiCheckCircle, FiLock, FiShoppingBag, FiDownload } from 'react-icons/fi';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import Button from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { useCartStore } from '@/lib/stores/cart-store';
import { ordersApi } from '@/lib/services/api';
import styles from './page.module.css';

// Paystack inline script type
declare global {
    interface Window {
        PaystackPop: {
            setup: (config: PaystackConfig) => { openIframe: () => void };
        };
    }
}

interface PaystackConfig {
    key: string;
    email: string;
    amount: number;
    currency: string;
    ref: string;
    metadata: {
        orderId: string;
        custom_fields: Array<{ display_name: string; variable_name: string; value: string }>;
    };
    callback: (response: { reference: string }) => void;
    onClose: () => void;
}

export default function CheckoutPage() {
    const { items, getSubtotal, getTotal, clearCart } = useCartStore();
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [success, setSuccess] = useState(false);
    const [orderId, setOrderId] = useState('');
    const [hasDigitalProducts, setHasDigitalProducts] = useState(false);
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', address: '', city: '', state: '', country: 'Nigeria',
    });

    // Check if cart has digital products
    useEffect(() => {
        const hasDigital = items.some(item => item.product.type === 'digital');
        setHasDigitalProducts(hasDigital);
    }, [items]);

    // Load Paystack script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(price);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const verifyPayment = async (reference: string, orderIdToVerify: string) => {
        setVerifying(true);
        try {
            const response = await fetch('/api/paystack/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reference, orderId: orderIdToVerify }),
            });
            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                clearCart();
            } else {
                alert('Payment verification failed. Please contact support.');
            }
        } catch (error) {
            console.error('Verification error:', error);
            alert('Payment verification failed. Please contact support.');
        } finally {
            setVerifying(false);
        }
    };

    const initiatePayment = (orderData: { orderId: string; email: string; amount: number; name: string }) => {
        const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

        if (!paystackPublicKey) {
            alert('Payment not configured. Please contact support.');
            return;
        }

        const handler = window.PaystackPop.setup({
            key: paystackPublicKey,
            email: orderData.email,
            amount: orderData.amount * 100, // Convert to kobo
            currency: 'NGN',
            ref: `RC-${orderData.orderId}-${Date.now()}`,
            metadata: {
                orderId: orderData.orderId,
                custom_fields: [
                    {
                        display_name: 'Customer Name',
                        variable_name: 'customer_name',
                        value: orderData.name,
                    },
                ],
            },
            callback: (response) => {
                verifyPayment(response.reference, orderData.orderId);
            },
            onClose: () => {
                setLoading(false);
                alert('Payment cancelled. Your order is saved, you can pay later.');
            },
        });

        handler.openIframe();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate for digital products - require email confirmation
        if (hasDigitalProducts && !formData.email) {
            alert('Email is required for digital product purchases.');
            return;
        }

        setLoading(true);
        try {
            const cartItems = items.map((item:any) => ({
                productId: item.product._id,
                title: item.product.title,
                type: item.product.type,
                quantity: item.quantity,
                price: item.product.discountedPrice || item.product.price,
                selectedOptions: item.selectedOptions,
                // Include digital file info for digital products
                digitalFile: item.product.type === 'digital' ? item.product.digitalFile : undefined,
                digitalFileName: item.product.type === 'digital' ? item.product.digitalFileName : undefined,
            }));

            const response = await ordersApi.create({
                userDetails: formData,
                cartItems,
                totalAmount: getTotal(),
                hasDigitalProducts,
            });

            if (response.data.success) {
                const createdOrderId = response.data.data.order.orderId;
                setOrderId(createdOrderId);

                // Initiate Paystack payment
                initiatePayment({
                    orderId: createdOrderId,
                    email: formData.email,
                    amount: getTotal(),
                    name: formData.name,
                });
            }
        } catch (error) {
            console.error('Checkout failed:', error);
            alert('Failed to create order. Please try again.');
            setLoading(false);
        }
    };

    if (items.length === 0 && !success) {
        return (
            <div className={styles.page}>
                <Header />
                <main className={styles.main}>
                    <div className={styles.container}>
                        <div className={styles.emptyCheckout}>
                            <FiShoppingBag size={48} />
                            <h2 className={styles.emptyTitle}>Your cart is empty</h2>
                            <p>Add some products to proceed with checkout</p>
                            <Link href="/market"><Button>Browse Products</Button></Link>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (verifying) {
        return (
            <div className={styles.page}>
                <Header />
                <main className={styles.main}>
                    <div className={styles.container}>
                        <div className={styles.verifying}>
                            <div className={styles.spinner} />
                            <h2>Verifying Payment...</h2>
                            <p>Please wait while we confirm your payment</p>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (success) {
        return (
            <div className={styles.page}>
                <Header />
                <main className={styles.main}>
                    <div className={styles.container}>
                        <div className={styles.success}>
                            <FiCheckCircle className={styles.successIcon} />
                            <h2 className={styles.successTitle}>Payment Successful! 🎉</h2>
                            <p className={styles.orderId}>Order ID: <strong>{orderId}</strong></p>

                            {hasDigitalProducts && (
                                <div className={styles.digitalNotice}>
                                    <FiDownload size={20} />
                                    <p>Your digital products are now available for download. Check your email or visit the product page.</p>
                                </div>
                            )}

                            <div className={styles.successActions}>
                                <Link href={`/track?orderId=${orderId}`}>
                                    <Button>Track Order</Button>
                                </Link>
                                <Link href="/market">
                                    <Button variant="secondary">Continue Shopping</Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <Header />
            <main className={styles.main}>
                <div className={styles.container}>
                    <h1 className={styles.title}>Checkout</h1>

                    {hasDigitalProducts && (
                        <div className={styles.digitalBanner}>
                            <FiDownload size={18} />
                            <span>Your cart contains digital products. Download links will be sent to your email after payment.</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={styles.layout}>
                        <div>
                            <div className={styles.formSection}>
                                <h2 className={styles.formTitle}>Contact Information</h2>
                                <div className={styles.formGrid}>
                                    <Input
                                        label="Full Name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                    <Input
                                        label="Email"
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                    <Input
                                        label="Phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                        className={styles.fullWidth}
                                    />
                                </div>
                            </div>

                            {/* Only show shipping for physical products */}
                            {items.some(item => item.product.type !== 'digital') && (
                                <div className={styles.formSection}>
                                    <h2 className={styles.formTitle}>Shipping Address</h2>
                                    <div className={styles.formGrid}>
                                        <Textarea
                                            label="Address"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            required
                                            className={styles.fullWidth}
                                        />
                                        <Input
                                            label="City"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            required
                                        />
                                        <Input
                                            label="State"
                                            name="state"
                                            value={formData.state}
                                            onChange={handleChange}
                                            required
                                        />
                                        <Input
                                            label="Country"
                                            name="country"
                                            value={formData.country}
                                            onChange={handleChange}
                                            required
                                            className={styles.fullWidth}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.summary}>
                            <h2 className={styles.summaryTitle}>Order Summary</h2>
                            <div className={styles.summaryItems}>
                                {items.map((item, i) => (
                                    <div key={i} className={styles.summaryItem}>
                                        <div className={styles.itemInfo}>
                                            <span className={styles.itemName}>{item.product.title}</span>
                                            <span className={styles.itemQty}>× {item.quantity}</span>
                                            {item.product.type === 'digital' && (
                                                <span className={styles.digitalBadge}>Digital</span>
                                            )}
                                        </div>
                                        <span className={styles.itemPrice}>
                                            {formatPrice((item.product.discountedPrice || item.product.price) * item.quantity)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className={styles.summaryDivider} />
                            <div className={styles.summaryRow}>
                                <span>Subtotal</span>
                                <span>{formatPrice(getSubtotal())}</span>
                            </div>
                            <div className={styles.summaryRow}>
                                <span>Shipping</span>
                                <span className={styles.freeShipping}>Free</span>
                            </div>
                            <div className={styles.summaryTotal}>
                                <span>Total</span>
                                <span>{formatPrice(getTotal())}</span>
                            </div>

                            <Button
                                type="submit"
                                fullWidth
                                size="lg"
                                loading={loading}
                                className={styles.submitBtn}
                                leftIcon={<FiLock size={16} />}
                            >
                                Pay {formatPrice(getTotal())}
                            </Button>

                            <div className={styles.secureNotice}>
                                <FiLock size={14} />
                                <span>Secured by Paystack</span>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
            <Footer />
        </div>
    );
}
