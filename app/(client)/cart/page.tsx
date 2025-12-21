'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FiMinus, FiPlus, FiTrash2, FiShoppingBag, FiPackage, FiChevronRight, FiDownload, FiShield } from 'react-icons/fi';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MaintenanceOverlay from '@/components/ui/maintenance-overlay';
import { useCartStore } from '@/lib/stores/cart-store';
import { useCurrency } from '@/lib/hooks/use-currency';
import styles from './page.module.css';

export default function CartPage() {
    const { items, updateQuantity, removeItem, getSubtotal, getTotal } = useCartStore();
    const { priceInCurrency }: any = useCurrency();

    const formatPrice = (price: number) => priceInCurrency(price);

    if (items.length === 0) {
        return (
            <div className={styles.page}>
                <MaintenanceOverlay />
                <Header />
                <main className={styles.main}>
                    <div className={styles.container}>
                        {/* Breadcrumb */}
                        <nav className={styles.breadcrumb}>
                            <Link href="/">Home</Link>
                            <FiChevronRight size={14} />
                            <span className={styles.breadcrumbCurrent}>Cart</span>
                        </nav>

                        <div className={styles.emptyCart}>
                            <FiShoppingBag className={styles.emptyIcon} />
                            <h2 className={styles.emptyTitle}>Your cart is empty</h2>
                            <p className={styles.emptyText}>Looks like you haven&apos;t added anything yet.</p>
                            <Link href="/market">
                                <button className={styles.checkoutBtn}>Browse Products</button>
                            </Link>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <MaintenanceOverlay />
            <Header />
            <main className={styles.main}>
                <div className={styles.container}>
                    {/* Breadcrumb */}
                    <nav className={styles.breadcrumb}>
                        <Link href="/">Home</Link>
                        <FiChevronRight size={14} />
                        <span className={styles.breadcrumbCurrent}>Cart</span>
                    </nav>

                    {/* Page Header */}
                    <div className={styles.pageHeader}>
                        <h1 className={styles.title}>Your Cart ({items.length} Items)</h1>
                        <p className={styles.subtitle}>Review your selected items before proceeding.</p>
                    </div>

                    <div className={styles.layout}>
                        {/* Cart Items Column */}
                        <div className={styles.cartItemsColumn}>
                            {/* Cart Table */}
                            <div className={styles.cartTable}>
                                {/* Table Head */}
                                <div className={styles.cartTableHead}>
                                    <div className={styles.cartTableHeadCell}>Product</div>
                                    <div className={styles.cartTableHeadCell}>Price</div>
                                    <div className={styles.cartTableHeadCell}>Quantity</div>
                                    <div className={`${styles.cartTableHeadCell} ${styles.alignRight}`}>Total</div>
                                    <div className={styles.cartTableHeadCell}></div>
                                </div>

                                {/* Cart Items */}
                                {items.map((item, index) => {
                                    const price = item.product.discountedPrice || item.product.price;
                                    const itemTotal = price * item.quantity;
                                    const sku = (item.product as any).sku || `SKU-${item.product._id.slice(-6).toUpperCase()}`;

                                    return (
                                        <div key={`${item.product._id}-${index}`} className={styles.cartItem}>
                                            {/* Product Cell */}
                                            <div className={styles.productCell}>
                                                <div className={styles.itemImage}>
                                                    {item.product.assets?.[0] ? (
                                                        <Image
                                                            src={item.product.assets[0]}
                                                            alt={item.product.title}
                                                            fill
                                                            sizes="80px"
                                                        />
                                                    ) : (
                                                        <div className={styles.itemPlaceholder}>
                                                            <FiPackage />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={styles.itemInfo}>
                                                    <Link href={`/market/${item.product.slug || item.product._id}`} className={styles.itemTitle}>
                                                        {item.product.title}
                                                    </Link>
                                                    <span className={styles.itemSku}>{sku}</span>
                                                    {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                                                        <span className={styles.itemOptions}>
                                                            {Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                                        </span>
                                                    )}
                                                    <span className={styles.itemPriceMobile}>{formatPrice(price)}</span>
                                                </div>
                                            </div>

                                            {/* Price Cell (Desktop) */}
                                            <div className={styles.priceCell}>
                                                {formatPrice(price)}
                                            </div>

                                            {/* Quantity Cell */}
                                            <div className={styles.quantityCell}>
                                                <div className={styles.quantityControls}>
                                                    <button
                                                        className={styles.quantityBtn}
                                                        onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                                                    >
                                                        <FiMinus size={14} />
                                                    </button>
                                                    <span className={styles.quantityValue}>{item.quantity}</span>
                                                    <button
                                                        className={styles.quantityBtn}
                                                        onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                                                    >
                                                        <FiPlus size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Total Cell (Desktop) */}
                                            <div className={styles.totalCell}>
                                                {formatPrice(itemTotal)}
                                            </div>

                                            {/* Remove Cell */}
                                            <div className={styles.removeCell}>
                                                <button
                                                    className={styles.removeBtn}
                                                    onClick={() => removeItem(item.product._id)}
                                                    aria-label="Remove item"
                                                >
                                                    <FiTrash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Frequently Bought Together */}
                            <div className={styles.relatedSection}>
                                <div className={styles.relatedHeader}>
                                    <h2 className={styles.relatedTitle}>Frequently Bought Together</h2>
                                    <Link href="/market" className={styles.relatedViewAll}>View All</Link>
                                </div>
                                <div className={styles.relatedGrid}>
                                    <div className={styles.relatedCard}>
                                        <div className={styles.relatedCardImage}>
                                            <FiPackage />
                                        </div>
                                        <h3 className={styles.relatedCardTitle}>Related Product</h3>
                                        <span className={styles.relatedCardPrice}>{formatPrice(2500)}</span>
                                    </div>
                                    <div className={styles.relatedCard}>
                                        <div className={styles.relatedCardImage}>
                                            <FiPackage />
                                        </div>
                                        <h3 className={styles.relatedCardTitle}>Related Product</h3>
                                        <span className={styles.relatedCardPrice}>{formatPrice(4500)}</span>
                                    </div>
                                    <div className={styles.relatedCard}>
                                        <div className={styles.relatedCardImage}>
                                            <FiPackage />
                                        </div>
                                        <h3 className={styles.relatedCardTitle}>Related Product</h3>
                                        <span className={styles.relatedCardPrice}>{formatPrice(3500)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Summary Sidebar */}
                        <div className={styles.summaryColumn}>
                            <div className={styles.summaryCards}>
                                {/* Order Summary Card */}
                                <div className={styles.summary}>
                                    <h2 className={styles.summaryTitle}>Order Summary</h2>

                                    <div className={styles.summaryRows}>
                                        <div className={styles.summaryRow}>
                                            <span>Subtotal</span>
                                            <span>{formatPrice(getSubtotal())}</span>
                                        </div>
                                        <div className={styles.summaryRow}>
                                            <span>Estimated Shipping</span>
                                            <span className={styles.summaryRowItalic}>Calculated at checkout</span>
                                        </div>
                                        <div className={styles.summaryRow}>
                                            <span>Estimated Tax</span>
                                            <span>{formatPrice(getSubtotal() * 0.08)}</span>
                                        </div>
                                    </div>

                                    <div className={styles.summaryTotal}>
                                        <span>Total</span>
                                        <span className={styles.summaryTotalPrice}>{formatPrice(getTotal())}</span>
                                    </div>

                                    <div className={styles.summaryActions}>
                                        <Link href="/checkout">
                                            <button className={styles.checkoutBtn}>
                                                PROCEED TO CHECKOUT
                                            </button>
                                        </Link>
                                        <button className={styles.downloadQuoteBtn}>
                                            <FiDownload size={16} />
                                            Download Quote
                                        </button>
                                    </div>
                                </div>

                                {/* Order Notes Card */}
                                <div className={styles.notesCard}>
                                    <h3 className={styles.notesTitle}>Order Notes</h3>
                                    <textarea
                                        className={styles.notesTextarea}
                                        placeholder="Special instructions for delivery or packaging..."
                                        rows={3}
                                    ></textarea>
                                </div>

                                {/* Trust Card */}
                                <div className={styles.trustCard}>
                                    <FiShield className={styles.trustCardIcon} size={20} />
                                    <div className={styles.trustCardContent}>
                                        <h4>Secure Checkout</h4>
                                        <p>
                                            All transactions are encrypted and secured. Need help? <Link href="#contact">Contact Support</Link>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
