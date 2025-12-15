'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { FiCheckCircle, FiLock, FiShoppingBag, FiDownload, FiPrinter, FiMail, FiPackage } from 'react-icons/fi';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import Button from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import MaintenanceOverlay from '@/components/ui/maintenance-overlay';
import { useCartStore } from '@/lib/stores/cart-store';
import { useCurrency } from '@/lib/hooks/use-currency';
import styles from './page.module.css';

/**
 * ======================================
 * CHECKOUT FLOW - PAYMENT BEFORE ORDER
 * ======================================
 * 
 * CORRECT FLOW:
 * 1. Customer fills out form (contact info, shipping if physical)
 * 2. Customer clicks "Pay" -> Opens Paystack popup
 * 3. Customer completes payment on Paystack
 * 4. Paystack callback sends reference to our verify endpoint
 * 5. Verify endpoint:
 *    a. Verifies payment with Paystack API
 *    b. If successful, CREATES the order with 'paid' status
 *    c. Returns order ID to client
 * 6. Client shows success message with order ID
 * 
 * This prevents orphan/unpaid orders from abandoned checkouts.
 */

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
    const { priceInCurrency }: any = useCurrency(); // Use global currency formatter
    const [verifying, setVerifying] = useState(false);
    const [success, setSuccess] = useState(false);
    const [orderId, setOrderId] = useState('');
    const [digitalItems, setDigitalItems] = useState<{ title: string; productId: string }[]>([]);
    const [hasDigitalProducts, setHasDigitalProducts] = useState(false);
    const [hasPhysicalProducts, setHasPhysicalProducts] = useState(false);
    // Order type: 'digital-only' | 'physical-only' | 'mixed'
    const [orderType, setOrderType] = useState<'digital-only' | 'physical-only' | 'mixed'>('physical-only');
    const [isFormValid, setIsFormValid] = useState(false);
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', address: '', city: '', state: '', country: 'Nigeria',
    });

    // Paystack config
    const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';

    // Check product types in cart and determine order type
    useEffect(() => {
        // Don't recalculate after success - the order type was already set from API response
        if (success) return;

        const hasDigital = items.some(item => item.product.type === 'digital');
        const hasPhysical = items.some(item => item.product.type !== 'digital');
        setHasDigitalProducts(hasDigital);
        setHasPhysicalProducts(hasPhysical);

        // Determine order type for post-purchase messaging
        if (hasDigital && hasPhysical) {
            setOrderType('mixed');
        } else if (hasDigital) {
            setOrderType('digital-only');
        } else {
            setOrderType('physical-only');
        }
    }, [items, success]);

    // Validate form
    useEffect(() => {
        const hasPhysicalProducts = items.some(item => item.product.type !== 'digital');
        const contactValid = formData.name && formData.email && formData.phone;
        const shippingValid = !hasPhysicalProducts || (formData.address && formData.city && formData.state);
        setIsFormValid(!!(contactValid && shippingValid));
    }, [formData, items]);

    // Use global formatter, but fall back to NGN if needed
    // NOTE: Paystack ALWAYS requires NGN, so checkout totals shown to Paystack button must be NGN.
    // However, for display on the page ("Total: $10"), we use format().
    const formatPrice = (price: number) => priceInCurrency(price);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    /**
     * Print Invoice Handler
     * Opens the browser print dialog so user can save their order as PDF
     * This allows them to keep a local copy with tracking ID
     */
    const handlePrintInvoice = () => {
        window.print();
    };

    /**
     * Prepare order data from cart and form
     * This data will be sent to the verify endpoint AFTER successful payment
     */
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

    /**
     * Verify payment and create order after successful Paystack payment
     */
    const verifyPaymentAndCreateOrder = async (reference: string) => {
        setVerifying(true);
        try {
            const orderData = prepareOrderData();

            const response = await fetch('/api/paystack/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reference,
                    orderData,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setOrderId(data.data.orderId);

                // Set order type from API response BEFORE clearing cart
                // This prevents the useEffect from resetting orderType to 'physical-only'
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

    /**
     * Store order data in sessionStorage before payment
     * This is retrieved by the verify page if user is redirected from Paystack
     */
    const storeOrderDataForVerify = () => {
        const orderData = prepareOrderData();
        sessionStorage.setItem('pendingOrderData', JSON.stringify(orderData));
        sessionStorage.setItem('pendingOrderType', orderType);
    };

    // Paystack callbacks
    const handlePaystackSuccess = (response: { reference: string }) => {
        // Clear stored data since we're verifying inline
        sessionStorage.removeItem('pendingOrderData');
        sessionStorage.removeItem('pendingOrderType');
        verifyPaymentAndCreateOrder(response.reference);
    };

    const handlePaystackClose = () => {
        // User closed the popup without completing payment
        // No order is created - this is intentional!
        // Also clean up any stored order data
        sessionStorage.removeItem('pendingOrderData');
        sessionStorage.removeItem('pendingOrderType');
        console.log('Payment cancelled by user');
    };

    // Generate unique reference
    const generateReference = () => {
        return `RC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    };

    // Paystack component config
    const paystackConfig = {
        reference: generateReference(),
        email: formData.email,
        amount: getTotal() * 100, // Convert to kobo
        publicKey: paystackPublicKey,
        currency: 'NGN',
        metadata: {
            custom_fields: [
                {
                    value: formData.name,
                }
            ],
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

    // Verifying payment state
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

    // Success state - Different messages based on order type
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
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // Checkout form
    return (
        <div className={styles.page}>
            <MaintenanceOverlay />
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

                    <div className={styles.layout}>
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
                            <div className={styles.currencyNote} style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem', textAlign: 'right' }}>
                                (Charged in NGN: {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(getTotal())})
                            </div>

                            {/* Paystack Button with react-paystack */}
                            {isFormValid && formData.email ? (
                                <PaystackButton
                                    {...paystackConfig}
                                    text={`Pay ${new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(getTotal())}`}
                                    onSuccess={handlePaystackSuccess}
                                    onClose={handlePaystackClose}
                                    onBankTransferConfirmationPending={() => storeOrderDataForVerify()}
                                    onClick={() => storeOrderDataForVerify()}
                                    className={styles.paystackBtn}
                                />
                            ) : (
                                <Button
                                    fullWidth
                                    size="lg"
                                    disabled
                                    className={styles.submitBtn}
                                    leftIcon={<FiLock size={16} />}
                                >
                                    Fill in required fields
                                </Button>
                            )}

                            <div className={styles.secureNotice}>
                                <FiLock size={14} />
                                <span>Secured by Paystack</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
