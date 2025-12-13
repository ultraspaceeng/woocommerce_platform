'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FiMinus, FiPlus, FiTrash2, FiShoppingBag, FiPackage } from 'react-icons/fi';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import Button from '@/components/ui/button';
import { useCartStore } from '@/lib/stores/cart-store';
import styles from './page.module.css';

export default function CartPage() {
    const { items, updateQuantity, removeItem, getSubtotal, getTotal } = useCartStore();

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(price);

    if (items.length === 0) {
        return (
            <div className={styles.page}>
                <Header />
                <main className={styles.main}>
                    <div className={styles.container}>
                        <h1 className={styles.title}>Shopping Cart</h1>
                        <div className={styles.emptyCart}>
                            <FiShoppingBag className={styles.emptyIcon} />
                            <h2 className={styles.emptyTitle}>Your cart is empty</h2>
                            <p className={styles.emptyText}>Looks like you haven&apos;t added anything yet.</p>
                            <Link href="/market"><Button>Browse Products</Button></Link>
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
                    <h1 className={styles.title}>Shopping Cart ({items.length} items)</h1>

                    <div className={styles.layout}>
                        <div className={styles.cartItems}>
                            {items.map((item, index) => {
                                const price = item.product.discountedPrice || item.product.price;
                                return (
                                    <div key={`${item.product._id}-${index}`} className={styles.cartItem}>
                                        <div className={styles.itemImage}>
                                            {item.product.assets?.[0] ? (
                                                <Image src={item.product.assets[0]} alt={item.product.title} fill sizes="80px" />
                                            ) : (
                                                <div className={styles.itemPlaceholder}><FiPackage /></div>
                                            )}
                                        </div>

                                        <div className={styles.itemDetails}>
                                            <Link href={`/market/${item.product.slug || item.product._id}`} className={styles.itemTitle}>
                                                {item.product.title}
                                            </Link>
                                            {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                                                <span className={styles.itemOptions}>
                                                    {Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                                </span>
                                            )}
                                            <span className={styles.itemPrice}>{formatPrice(price * item.quantity)}</span>
                                        </div>

                                        <div className={styles.itemActions}>
                                            <div className={styles.quantityControls}>
                                                <button className={styles.quantityBtn} onClick={() => updateQuantity(item.product._id, item.quantity - 1)}><FiMinus size={14} /></button>
                                                <span className={styles.quantityValue}>{item.quantity}</span>
                                                <button className={styles.quantityBtn} onClick={() => updateQuantity(item.product._id, item.quantity + 1)}><FiPlus size={14} /></button>
                                            </div>
                                            <button className={styles.removeBtn} onClick={() => removeItem(item.product._id)}>
                                                <FiTrash2 size={14} /> Remove
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className={styles.summary}>
                            <h2 className={styles.summaryTitle}>Order Summary</h2>
                            <div className={styles.summaryRow}><span>Subtotal</span><span>{formatPrice(getSubtotal())}</span></div>
                            <div className={styles.summaryRow}><span>Shipping</span><span>Calculated at checkout</span></div>
                            <div className={styles.summaryTotal}><span>Total</span><span>{formatPrice(getTotal())}</span></div>
                            <Link href="/checkout"><Button fullWidth size="lg" className={styles.checkoutBtn}>Proceed to Checkout</Button></Link>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
