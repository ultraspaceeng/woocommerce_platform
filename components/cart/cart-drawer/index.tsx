'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FiX, FiMinus, FiPlus, FiShoppingBag, FiPackage, FiDownload } from 'react-icons/fi';
import Button from '@/components/ui/button';
import { useCartStore } from '@/lib/stores/cart-store';
import { useCurrency } from '@/lib/hooks/use-currency';
import styles from './cart-drawer.module.css';

export default function CartDrawer() {
    const { items, isOpen, closeCart, updateQuantity, removeItem, getSubtotal } = useCartStore();

    const { priceInCurrency }:any = useCurrency();

    const formatPrice = (price: number) => priceInCurrency(price);

    return (
        <>
            <div className={`${styles.overlay} ${isOpen ? styles.visible : ''}`} onClick={closeCart} />

            <div className={`${styles.cartDrawer} ${isOpen ? styles.open : ''}`}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Cart ({items.length})</h2>
                    <button className={styles.closeBtn} onClick={closeCart}>
                        <FiX size={20} />
                    </button>
                </div>

                {items.length === 0 ? (
                    <div className={styles.emptyCart}>
                        <FiShoppingBag className={styles.emptyIcon} />
                        <p>Your cart is empty</p>
                    </div>
                ) : (
                    <>
                        <div className={styles.items}>
                            {items.map((item, index) => {
                                const price = item.product.discountedPrice || item.product.price;
                                return (
                                    <div key={`${item.product._id}-${index}`} className={styles.item}>
                                        <div className={styles.itemImage}>
                                            {item.product.assets?.[0] ? (
                                                <Image src={item.product.assets[0]} alt={item.product.title} fill sizes="64px" />
                                            ) : (
                                                <div className={styles.itemPlaceholder}><FiPackage /></div>
                                            )}
                                        </div>
                                        <div className={styles.itemDetails}>
                                            <div className={styles.itemTitle}>{item.product.title}</div>
                                            <div className={styles.itemPrice}>{formatPrice(price * item.quantity)}</div>
                                        </div>
                                        <div className={styles.itemActions}>
                                            <div className={styles.quantityControls}>
                                                <button className={styles.qtyBtn} onClick={() => updateQuantity(item.product._id, item.quantity - 1)}><FiMinus size={12} /></button>
                                                <span className={styles.qtyValue}>{item.quantity}</span>
                                                <button className={styles.qtyBtn} onClick={() => updateQuantity(item.product._id, item.quantity + 1)}><FiPlus size={12} /></button>
                                            </div>
                                            <button className={styles.removeBtn} onClick={() => removeItem(item.product._id)}>Remove</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className={styles.footer}>
                            <div className={styles.subtotal}>
                                <span className={styles.subtotalLabel}>Subtotal</span>
                                <span className={styles.subtotalValue}>{formatPrice(getSubtotal())}</span>
                            </div>
                            <Link href="/checkout" onClick={closeCart}>
                                <Button fullWidth size="lg">Checkout</Button>
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
