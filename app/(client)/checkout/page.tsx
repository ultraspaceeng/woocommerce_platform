'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { FiCheckCircle, FiLock, FiShoppingBag, FiDownload, FiPrinter, FiMail, FiPackage, FiChevronRight, FiChevronLeft, FiHelpCircle, FiShield } from 'react-icons/fi';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import Button from '@/components/ui/button';
import MaintenanceOverlay from '@/components/ui/maintenance-overlay';
import { useCartStore } from '@/lib/stores/cart-store';
import { useCurrency } from '@/lib/hooks/use-currency';
import styles from './page.module.css';

// Dynamic import for react-paystack (client-side only)
const PaystackButton: any = dynamic(
    () => import('react-paystack').then((mod) => mod.PaystackButton),
    { ssr: false }
);

interface CartItemForOrder {
    productId: string;
    title: string;
    type: 'physical' | 'digital';
    quantity: number;
    price: number;
    selectedOptions?: Record<string, string>;
    digitalFile?: string;
    digitalFileName?: string;
}

export default function CheckoutPage() {
    const { items, getSubtotal, getTotal, clearCart } = useCartStore();
    const { priceInCurrency }: any = useCurrency();
    const [verifying, setVerifying] = useState(false);
    const [success, setSuccess] = useState(false);
    const [orderId, setOrderId] = useState('');
    const [digitalItems, setDigitalItems] = useState<{ title: string; productId: string }[]>([]);
    const [hasDigitalProducts, setHasDigitalProducts] = useState(false);
    const [hasPhysicalProducts, setHasPhysicalProducts] = useState(false);
    const [orderType, setOrderType] = useState<'digital-only' | 'physical-only' | 'mixed'>('physical-only');
    const [isFormValid, setIsFormValid] = useState(false);
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', address: '', city: '', state: '', country: 'Nigeria', newsletter: false,
    });

    const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';

    useEffect(() => {
        if (success) return;
        const hasDigital = items.some(item => item.product.type === 'digital');
        const hasPhysical = items.some(item => item.product.type !== 'digital');
        setHasDigitalProducts(hasDigital);
        setHasPhysicalProducts(hasPhysical);
        if (hasDigital && hasPhysical) {
            setOrderType('mixed');
        } else if (hasDigital) {
            setOrderType('digital-only');
        } else {
            setOrderType('physical-only');
        }
    }, [items, success]);

    useEffect(() => {
        const hasPhysicalProducts = items.some(item => item.product.type !== 'digital');
        const contactValid = formData.name && formData.email && formData.phone;
        const shippingValid = !hasPhysicalProducts || (formData.address && formData.city && formData.state);
        setIsFormValid(!!(contactValid && shippingValid));
    }, [formData, items]);

    const formatPrice = (price: number) => priceInCurrency(price);
    const formatNGN = (price: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(price);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const target = e.target;
        const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
        setFormData({ ...formData, [target.name]: value });
    };

    const handlePrintInvoice = () => {
        window.print();
    };

    const prepareOrderData = useCallback((): {
        userDetails: typeof formData;
        cartItems: CartItemForOrder[];
        totalAmount: number;
        hasDigitalProducts: boolean
    } => {
        const cartItems: CartItemForOrder[] = items.map((item: any) => ({
            productId: item.product._id,
            title: item.product.title,
            type: item.product.type as 'physical' | 'digital',
            quantity: item.quantity,
            price: item.product.discountedPrice || item.product.price,
            selectedOptions: item.selectedOptions,
            digitalFile: item.product.type === 'digital' ? item.product.digitalFile : undefined,
            digitalFileName: item.product.type === 'digital' ? item.product.digitalFileName : undefined,
        }));
        return {
            userDetails: formData,
            cartItems,
            totalAmount: getTotal(),
            hasDigitalProducts,
        };
    }, [items, formData, getTotal, hasDigitalProducts]);

    const verifyPaymentAndCreateOrder = async (reference: string) => {
        setVerifying(true);
        try {
            const orderData = prepareOrderData();
            const response = await fetch('/api/paystack/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reference, orderData }),
            });
            const data = await response.json();
            if (data.success) {
                setOrderId(data.data.orderId);
                const hasDigital = data.data.hasDigitalProducts;
                const hasPhysical = data.data.hasPhysicalProducts;
                if (hasDigital && hasPhysical) {
                    setOrderType('mixed');
                } else if (hasDigital) {
                    setOrderType('digital-only');
                } else {
                    setOrderType('physical-only');
                }
                if (data.data.digitalItems && data.data.digitalItems.length > 0) {
                    setDigitalItems(data.data.digitalItems);
                }
                setSuccess(true);
                clearCart();
            } else {
                alert(`Payment verification failed: ${data.error || 'Unknown error'}. Please contact support with reference: ${reference}`);
            }
        } catch (error) {
            console.error('Verification error:', error);
            alert(`Payment verification failed. Please contact support with reference: ${reference}`);
        } finally {
            setVerifying(false);
        }
    };

    const storeOrderDataForVerify = () => {
        const orderData = prepareOrderData();
        sessionStorage.setItem('pendingOrderData', JSON.stringify(orderData));
        sessionStorage.setItem('pendingOrderType', orderType);
    };

    const handlePaystackSuccess = (response: { reference: string }) => {
        sessionStorage.removeItem('pendingOrderData');
        sessionStorage.removeItem('pendingOrderType');
        verifyPaymentAndCreateOrder(response.reference);
    };

    const handlePaystackClose = () => {
        sessionStorage.removeItem('pendingOrderData');
        sessionStorage.removeItem('pendingOrderType');
        console.log('Payment cancelled by user');
    };

    const generateReference = () => {
        return `RC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    };

    const paystackConfig = {
        reference: generateReference(),
        email: formData.email,
        amount: getTotal() * 100,
        publicKey: paystackPublicKey,
        currency: 'NGN',
        metadata: {
            custom_fields: [{ value: formData.name }],
        },
    };

    // Empty cart state
    if (items.length === 0 && !success) {
        return (
            <div className={styles.page}>
                <MaintenanceOverlay />
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

    // Verifying state
    if (verifying) {
        return (
            <div className={styles.page}>
                <Header />
                <main className={styles.main}>
                    <div className={styles.container}>
                        <div className={styles.verifying}>
                            <div className={styles.spinner} />
                            <h2>Verifying Payment...</h2>
                            <p>Please wait while we confirm your payment and create your order</p>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // Success state
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
                            {orderType === 'digital-only' && (
                                <div className={styles.digitalNotice}>
                                    <FiMail size={20} />
                                    <div>
                                        <p><strong>Check your email!</strong></p>
                                        <p>Your download link has been sent to your email address.</p>
                                        {digitalItems.length > 0 && (
                                            <div className={styles.downloadLinks}>
                                                <p><strong>Download your files directly:</strong></p>
                                                {digitalItems.map((item, index) => (
                                                    <a key={index} href={`/api/download/${orderId}/${item.productId}`} className={styles.downloadLink} download>
                                                        <FiDownload size={14} /><span>{item.title}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {orderType === 'physical-only' && (
                                <div className={styles.physicalNotice}>
                                    <FiPackage size={20} />
                                    <div>
                                        <p><strong>Save Your Tracking ID</strong></p>
                                        <p>Print or save this invoice as PDF to keep your tracking ID (<strong>{orderId}</strong>).</p>
                                    </div>
                                </div>
                            )}
                            {orderType === 'mixed' && (
                                <>
                                    <div className={styles.digitalNotice}>
                                        <FiMail size={20} />
                                        <div>
                                            <p><strong>Digital Products</strong></p>
                                            <p>Check your email for download links.</p>
                                            {digitalItems.length > 0 && (
                                                <div className={styles.downloadLinks}>
                                                    {digitalItems.map((item, index) => (
                                                        <a key={index} href={`/api/download/${orderId}/${item.productId}`} className={styles.downloadLink} download>
                                                            <FiDownload size={14} /><span>{item.title}</span>
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
                                            <p>Print this invoice to save your tracking ID (<strong>{orderId}</strong>).</p>
                                        </div>
                                    </div>
                                </>
                            )}
                            <div className={styles.successActions}>
                                {(orderType === 'physical-only' || orderType === 'mixed') && (
                                    <>
                                        <Button onClick={handlePrintInvoice}><FiPrinter size={16} /> Print Invoice</Button>
                                        <Link href={`/order-tracking?orderId=${orderId}`}><Button variant="secondary">Track Order</Button></Link>
                                    </>
                                )}
                                <Link href="/market"><Button variant={orderType === 'digital-only' ? 'primary' : 'secondary'}>Continue Shopping</Button></Link>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // Checkout Form - Split Pane Layout
    return (
        <div className={styles.page}>
            <MaintenanceOverlay />
            <div className={styles.layout}>
                {/* Left Column - Form */}
                <div className={styles.formColumn}>
                    <div className={styles.formContent}>
                        {/* Header */}
                        <header className={styles.checkoutHeader}>
                            <Link href="/" className={styles.logoSection}>
                                <div className={styles.logoIcon}><FiShoppingBag size={18} /></div>
                                <span className={styles.logoText}>UltraSpace Store</span>
                            </Link>
                            <div className={styles.secureIcon}><FiLock size={18} /></div>
                        </header>

                        {/* Breadcrumb */}
                        <nav className={styles.breadcrumb}>
                            <Link href="/cart">Cart</Link>
                            <FiChevronRight size={12} className={styles.breadcrumbIcon} />
                            <span className={styles.breadcrumbCurrent}>Information</span>
                            <FiChevronRight size={12} className={styles.breadcrumbIcon} />
                            <span className={styles.breadcrumbFuture}>Shipping</span>
                            <FiChevronRight size={12} className={styles.breadcrumbIcon} />
                            <span className={styles.breadcrumbFuture}>Payment</span>
                        </nav>

                        {/* Digital Banner */}
                        {hasDigitalProducts && (
                            <div className={styles.digitalBanner}>
                                <FiDownload size={18} />
                                <span>Your cart contains digital products. Download links will be sent to your email.</span>
                            </div>
                        )}

                        {/* Contact Information */}
                        <div className={styles.formSection}>
                            <div className={styles.formSectionHeader}>
                                <h2 className={styles.formTitle}>Contact information</h2>
                                <div className={styles.formLoginPrompt}>
                                    Already have an account? <Link href="/auth/login">Log in</Link>
                                </div>
                            </div>
                            <div className={styles.formGrid}>
                                <div className={styles.inputGroup}>
                                    <label className={styles.inputLabel}>Email address</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="buyer@company.com" className={styles.inputField} required />
                                </div>
                            </div>
                            <div className={styles.checkboxGroup}>
                                <input type="checkbox" name="newsletter" checked={formData.newsletter as any} onChange={handleChange} className={styles.checkbox} id="newsletter" />
                                <label htmlFor="newsletter" className={styles.checkboxLabel}>Email me with news and offers</label>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        {hasPhysicalProducts && (
                            <div className={styles.formSection}>
                                <h2 className={styles.formTitle}>Shipping address</h2>
                                <div className={styles.formGrid}>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Country/Region</label>
                                        <select name="country" value={formData.country} onChange={handleChange} className={`${styles.inputField} ${styles.selectField}`}>
                                            <option>Nigeria</option>
                                            <option>Ghana</option>
                                            <option>Kenya</option>
                                            <option>South Africa</option>
                                        </select>
                                    </div>
                                </div>
                                <div className={styles.formGridHalf}>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>First name</label>
                                        <input type="text" name="name" value={formData.name} onChange={handleChange} className={styles.inputField} required />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Phone</label>
                                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={styles.inputField} required />
                                    </div>
                                </div>
                                <div className={styles.formGrid}>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Address</label>
                                        <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="123 Business Park Dr" className={styles.inputField} required />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>City</label>
                                        <input type="text" name="city" value={formData.city} onChange={handleChange} className={styles.inputField} required />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>State</label>
                                        <input type="text" name="state" value={formData.state} onChange={handleChange} className={styles.inputField} required />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Digital-only: Just contact info */}
                        {!hasPhysicalProducts && (
                            <div className={styles.formSection}>
                                <h2 className={styles.formTitle}>Your Information</h2>
                                <div className={styles.formGridHalf}>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Full Name</label>
                                        <input type="text" name="name" value={formData.name} onChange={handleChange} className={styles.inputField} required />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Phone</label>
                                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={styles.inputField} required />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Form Actions */}
                        <div className={styles.formActions}>
                            <Link href="/cart" className={styles.backLink}>
                                <FiChevronLeft size={16} /> Return to cart
                            </Link>
                            {isFormValid && formData.email ? (
                                <PaystackButton
                                    {...paystackConfig}
                                    text={`Pay ${formatNGN(getTotal())}`}
                                    onSuccess={handlePaystackSuccess}
                                    onClose={handlePaystackClose}
                                    onBankTransferConfirmationPending={() => storeOrderDataForVerify()}
                                    onClick={() => storeOrderDataForVerify()}
                                    className={styles.continueBtn}
                                />
                            ) : (
                                <button className={styles.continueBtn} disabled>
                                    <FiLock size={16} /> Fill required fields
                                </button>
                            )}
                        </div>

                        {/* Policy Links */}
                        <div className={styles.policyLinks}>
                            <a href="#">Refund policy</a>
                            <a href="#">Shipping policy</a>
                            <a href="#">Privacy policy</a>
                            <a href="#">Terms of service</a>
                        </div>
                    </div>
                </div>

                {/* Right Column - Order Summary */}
                <aside className={styles.summaryColumn}>
                    <div className={styles.summaryContent}>
                        {/* Product Items */}
                        <div className={styles.summaryItems}>
                            {items.map((item, i) => (
                                <div key={i} className={styles.summaryItem}>
                                    <div className={styles.summaryItemImage}>
                                        {item.product.assets?.[0] ? (
                                            <Image src={item.product.assets[0]} alt={item.product.title} fill sizes="64px" />
                                        ) : (
                                            <FiPackage size={24} style={{ color: 'var(--color-border)' }} />
                                        )}
                                        <span className={styles.summaryItemBadge}>{item.quantity}</span>
                                    </div>
                                    <div className={styles.summaryItemInfo}>
                                        <span className={styles.summaryItemName}>{item.product.title}</span>
                                        {item.product.type === 'digital' && <span className={styles.digitalBadge}>Digital</span>}
                                        {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                                            <span className={styles.summaryItemVariant}>
                                                {Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(' / ')}
                                            </span>
                                        )}
                                    </div>
                                    <span className={styles.summaryItemPrice}>
                                        {formatPrice((item.product.discountedPrice || item.product.price) * item.quantity)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Discount Code */}
                        <div className={styles.discountSection}>
                            <input type="text" placeholder="Discount code or gift card" className={styles.discountInput} />
                            <button className={styles.discountBtn}>Apply</button>
                        </div>

                        {/* Summary Rows */}
                        <div className={styles.summaryRows}>
                            <div className={styles.summaryRow}>
                                <span>Subtotal</span>
                                <span>{formatPrice(getSubtotal())}</span>
                            </div>
                            <div className={styles.summaryRow}>
                                <span>Shipping <FiHelpCircle size={12} className={styles.helpIcon} /></span>
                                <span className={styles.summaryRowMuted}>Calculated at next step</span>
                            </div>
                            <div className={styles.summaryRow}>
                                <span>Estimated taxes</span>
                                <span>{formatPrice(getSubtotal() * 0.08)}</span>
                            </div>
                        </div>

                        {/* Total */}
                        <div className={styles.summaryTotal}>
                            <span className={styles.summaryTotalLabel}>Total</span>
                            <div className={styles.summaryTotalValue}>
                                <span className={styles.summaryTotalCurrency}>NGN</span>
                                <span className={styles.summaryTotalPrice}>{formatNGN(getTotal()).replace('₦', '')}</span>
                            </div>
                        </div>

                        {/* Trust Badges */}
                        <div className={styles.trustBadges}>
                            <div className={styles.trustBadge}>VISA</div>
                            <div className={styles.trustBadge}>MC</div>
                            <div className={styles.trustBadge}>VERVE</div>
                            <div className={styles.secureBadge}>
                                <FiLock size={12} /> Secure
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
