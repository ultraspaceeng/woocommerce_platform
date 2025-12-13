'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiCheckCircle } from 'react-icons/fi';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import Button from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { useCartStore } from '@/lib/stores/cart-store';
import { ordersApi } from '@/lib/services/api';
import styles from './page.module.css';

export default function CheckoutPage() {
    const { items, getSubtotal, getTotal, clearCart } = useCartStore();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [orderId, setOrderId] = useState('');
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', address: '', city: '', state: '', country: 'Nigeria',
    });

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(price);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const cartItems = items.map((item) => ({
                product: item.product._id,
                productTitle: item.product.title,
                quantity: item.quantity,
                price: item.product.discountedPrice || item.product.price,
                selectedOptions: item.selectedOptions,
            }));

            const response = await ordersApi.create({
                userDetails: formData,
                cartItems,
                totalAmount: getTotal(),
            });

            if (response.data.success) {
                setOrderId(response.data.data.order.orderId);
                setSuccess(true);
                clearCart();
            }
        } catch (error) {
            console.error('Checkout failed:', error);
            alert('Checkout failed. Please try again.');
        } finally {
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
                            <h2 className={styles.emptyTitle}>Your cart is empty</h2>
                            <Link href="/market"><Button>Browse Products</Button></Link>
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
                            <h2 className={styles.successTitle}>Order Placed Successfully!</h2>
                            <p className={styles.orderId}>Order ID: {orderId}</p>
                            <div className={styles.successActions}>
                                <Link href={`/order-tracking?orderId=${orderId}`}><Button>Track Order</Button></Link>
                                <Link href="/market"><Button variant="secondary">Continue Shopping</Button></Link>
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

                    <form onSubmit={handleSubmit} className={styles.layout}>
                        <div>
                            <div className={styles.formSection}>
                                <h2 className={styles.formTitle}>Contact Information</h2>
                                <div className={styles.formGrid}>
                                    <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} required />
                                    <Input label="Email" type="email" name="email" value={formData.email} onChange={handleChange} required />
                                    <Input label="Phone" name="phone" value={formData.phone} onChange={handleChange} required className={styles.fullWidth} />
                                </div>
                            </div>

                            <div className={styles.formSection}>
                                <h2 className={styles.formTitle}>Shipping Address</h2>
                                <div className={styles.formGrid}>
                                    <Textarea label="Address" name="address" value={formData.address} onChange={handleChange} required className={styles.fullWidth} />
                                    <Input label="City" name="city" value={formData.city} onChange={handleChange} required />
                                    <Input label="State" name="state" value={formData.state} onChange={handleChange} required />
                                    <Input label="Country" name="country" value={formData.country} onChange={handleChange} required className={styles.fullWidth} />
                                </div>
                            </div>
                        </div>

                        <div className={styles.summary}>
                            <h2 className={styles.summaryTitle}>Order Summary</h2>
                            <div className={styles.summaryItems}>
                                {items.map((item, i) => (
                                    <div key={i} className={styles.summaryItem}>
                                        <span>{item.product.title} × {item.quantity}</span>
                                        <span>{formatPrice((item.product.discountedPrice || item.product.price) * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className={styles.summaryRow}><span>Subtotal</span><span>{formatPrice(getSubtotal())}</span></div>
                            <div className={styles.summaryRow}><span>Shipping</span><span>Free</span></div>
                            <div className={styles.summaryTotal}><span>Total</span><span>{formatPrice(getTotal())}</span></div>
                            <Button type="submit" fullWidth size="lg" loading={loading} className={styles.submitBtn}>Place Order</Button>
                        </div>
                    </form>
                </div>
            </main>
            <Footer />
        </div>
    );
}
