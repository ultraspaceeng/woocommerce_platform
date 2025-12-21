'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    FiArrowLeft, FiPackage, FiTruck, FiCheckCircle, FiClock,
    FiUser, FiMail, FiPhone, FiMapPin, FiCreditCard, FiSave,
    FiDownload, FiEdit2, FiX
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { ordersApi } from '@/lib/services/api';
import { useCurrency } from '@/lib/hooks/use-currency';
import styles from './page.module.css';

type PaymentStatus = 'pending' | 'paid' | 'failed';
type FulfillmentStatus = 'unfulfilled' | 'processing' | 'shipped' | 'fulfilled';

interface OrderItem {
    productId: string;
    title: string;
    type?: 'physical' | 'digital';
    quantity: number;
    price: number;
    selectedOptions?: Record<string, string>;
}

interface UserDetails {
    name: string;
    email: string;
    phone: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
}

interface PaymentDetails {
    amount: number;
    currency: string;
    channel: string;
    reference: string;
    paidAt: string;
}

interface Order {
    _id: string;
    orderId: string;
    userDetails: UserDetails;
    cartItems: OrderItem[];
    totalAmount: number;
    paymentStatus: PaymentStatus;
    paystackRef?: string;
    paymentDetails?: PaymentDetails;
    paidAt?: string;
    hasDigitalProducts: boolean;
    fulfillmentStatus: FulfillmentStatus;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

const statusColors: Record<string, string> = {
    pending: 'warning',
    paid: 'success',
    failed: 'error',
    unfulfilled: 'warning',
    processing: 'info',
    shipped: 'purple',
    fulfilled: 'success',
};

const statusIcons: Record<string, React.ReactNode> = {
    unfulfilled: <FiClock size={16} />,
    processing: <FiPackage size={16} />,
    shipped: <FiTruck size={16} />,
    fulfilled: <FiCheckCircle size={16} />,
};

export default function OrderDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const { priceInCurrency }: any = useCurrency();

    // Editable fields
    const [fulfillmentStatus, setFulfillmentStatus] = useState<FulfillmentStatus>('unfulfilled');
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
    const [notes, setNotes] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const response = await ordersApi.getById(params.id as string);
                const orderData = response.data.data;
                setOrder(orderData);
                setFulfillmentStatus(orderData.fulfillmentStatus);
                setPaymentStatus(orderData.paymentStatus);
                setNotes(orderData.notes || '');
            } catch (err) {
                console.error('Failed to fetch order:', err);
                setError('Failed to load order details');
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchOrder();
        }
    }, [params.id]);

    const handleSave = async () => {
        if (!order) return;

        setSaving(true);
        try {
            await ordersApi.updateStatus(order._id, {
                fulfillmentStatus,
                paymentStatus,
                notes,
            });

            // Update local state
            setOrder({
                ...order,
                fulfillmentStatus,
                paymentStatus,
                notes,
            });
            setIsEditing(false);
        } catch (err) {
            console.error('Failed to update order:', err);
            toast.error('Failed to update order. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (order) {
            setFulfillmentStatus(order.fulfillmentStatus);
            setPaymentStatus(order.paymentStatus);
            setNotes(order.notes || '');
        }
        setIsEditing(false);
    };

    const formatCurrency = (amount: number) => priceInCurrency(amount);

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.loading}>Loading order details...</div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className={styles.page}>
                <div className={styles.error}>
                    <FiPackage size={48} />
                    <h2>Order Not Found</h2>
                    <p>{error || 'The requested order could not be found.'}</p>
                    <Link href="/admin/orders" className={styles.backLink}>
                        <FiArrowLeft /> Back to Orders
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Page Header */}
            <div className={styles.pageHeader}>
                <div className={styles.headerLeft}>
                    <Link href="/admin/orders" className={styles.backBtn}>
                        <FiArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className={styles.pageTitle}>Order {order.orderId}</h1>
                        <p className={styles.pageSubtitle}>
                            Placed on {formatDate(order.createdAt)}
                        </p>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    {isEditing ? (
                        <>
                            <button
                                className={styles.cancelBtn}
                                onClick={handleCancel}
                                disabled={saving}
                            >
                                <FiX size={16} />
                                Cancel
                            </button>
                            <button
                                className={styles.saveBtn}
                                onClick={handleSave}
                                disabled={saving}
                            >
                                <FiSave size={16} />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </>
                    ) : (
                        <button
                            className={styles.editBtn}
                            onClick={() => setIsEditing(true)}
                        >
                            <FiEdit2 size={16} />
                            Edit Order
                        </button>
                    )}
                </div>
            </div>

            {/* Status Cards */}
            <div className={styles.statusRow}>
                <div className={`${styles.statusCard} ${styles[statusColors[order.paymentStatus]]}`}>
                    <FiCreditCard size={20} />
                    <div>
                        <span className={styles.statusLabel}>Payment</span>
                        {isEditing ? (
                            <select
                                className={styles.statusSelect}
                                value={paymentStatus}
                                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                            >
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="failed">Failed</option>
                            </select>
                        ) : (
                            <span className={styles.statusValue}>{order.paymentStatus}</span>
                        )}
                    </div>
                </div>
                <div className={`${styles.statusCard} ${styles[statusColors[order.fulfillmentStatus]]}`}>
                    {statusIcons[order.fulfillmentStatus]}
                    <div>
                        <span className={styles.statusLabel}>Fulfillment</span>
                        {isEditing ? (
                            <select
                                className={styles.statusSelect}
                                value={fulfillmentStatus}
                                onChange={(e) => setFulfillmentStatus(e.target.value as FulfillmentStatus)}
                            >
                                <option value="unfulfilled">Unfulfilled</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="fulfilled">Fulfilled</option>
                            </select>
                        ) : (
                            <span className={styles.statusValue}>{order.fulfillmentStatus}</span>
                        )}
                    </div>
                </div>
                <div className={styles.statusCard}>
                    <FiPackage size={20} />
                    <div>
                        <span className={styles.statusLabel}>Total</span>
                        <span className={styles.statusValue}>{formatCurrency(order.totalAmount)}</span>
                    </div>
                </div>
            </div>

            <div className={styles.contentGrid}>
                {/* Order Items */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>
                        <FiPackage size={18} />
                        Order Items ({order.cartItems.length})
                    </h2>
                    <div className={styles.itemsList}>
                        {order.cartItems.map((item, index) => (
                            <div key={index} className={styles.orderItem}>
                                <div className={styles.itemDetails}>
                                    <span className={styles.itemName}>{item.title}</span>
                                    {item.type === 'digital' && (
                                        <span className={styles.digitalBadge}>
                                            <FiDownload size={12} /> Digital
                                        </span>
                                    )}
                                    {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                                        <span className={styles.itemOptions}>
                                            {Object.entries(item.selectedOptions).map(([key, value]) => (
                                                <span key={key}>{key}: {value}</span>
                                            ))}
                                        </span>
                                    )}
                                </div>
                                <div className={styles.itemMeta}>
                                    <span className={styles.itemQty}>× {item.quantity}</span>
                                    <span className={styles.itemPrice}>{formatCurrency(item.price * item.quantity)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className={styles.itemsTotal}>
                        <span>Total</span>
                        <span>{formatCurrency(order.totalAmount)}</span>
                    </div>
                </div>

                {/* Customer Details */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>
                        <FiUser size={18} />
                        Customer Details
                    </h2>
                    <div className={styles.detailsList}>
                        <div className={styles.detailRow}>
                            <FiUser size={16} />
                            <span>{order.userDetails.name}</span>
                        </div>
                        <div className={styles.detailRow}>
                            <FiMail size={16} />
                            <a href={`mailto:${order.userDetails.email}`}>{order.userDetails.email}</a>
                        </div>
                        <div className={styles.detailRow}>
                            <FiPhone size={16} />
                            <a href={`tel:${order.userDetails.phone}`}>{order.userDetails.phone}</a>
                        </div>
                        {order.userDetails.address && (
                            <div className={styles.detailRow}>
                                <FiMapPin size={16} />
                                <span>
                                    {order.userDetails.address}
                                    {order.userDetails.city && `, ${order.userDetails.city}`}
                                    {order.userDetails.state && `, ${order.userDetails.state}`}
                                    {order.userDetails.country && `, ${order.userDetails.country}`}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Payment Info */}
                {order.paymentDetails && (
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>
                            <FiCreditCard size={18} />
                            Payment Information
                        </h2>
                        <div className={styles.detailsList}>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Reference</span>
                                <span className={styles.detailValue}>{order.paymentDetails.reference}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Channel</span>
                                <span className={styles.detailValue}>{order.paymentDetails.channel}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Amount</span>
                                <span className={styles.detailValue}>
                                    {formatCurrency(order.paymentDetails.amount)}
                                </span>
                            </div>
                            {order.paymentDetails.paidAt && (
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Paid At</span>
                                    <span className={styles.detailValue}>{formatDate(order.paymentDetails.paidAt)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Notes */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>
                        <FiEdit2 size={18} />
                        Order Notes
                    </h2>
                    {isEditing ? (
                        <textarea
                            className={styles.notesInput}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add internal notes about this order..."
                            rows={4}
                        />
                    ) : (
                        <p className={styles.notesText}>
                            {order.notes || 'No notes added yet.'}
                        </p>
                    )}
                </div>
            </div>

            {/* Timeline */}
            <div className={styles.card}>
                <h2 className={styles.cardTitle}>
                    <FiClock size={18} />
                    Order Timeline
                </h2>
                <div className={styles.timeline}>
                    <div className={styles.timelineItem}>
                        <div className={styles.timelineDot} />
                        <div className={styles.timelineContent}>
                            <span className={styles.timelineTitle}>Order Created</span>
                            <span className={styles.timelineDate}>{formatDate(order.createdAt)}</span>
                        </div>
                    </div>
                    {order.paidAt && (
                        <div className={styles.timelineItem}>
                            <div className={`${styles.timelineDot} ${styles.success}`} />
                            <div className={styles.timelineContent}>
                                <span className={styles.timelineTitle}>Payment Received</span>
                                <span className={styles.timelineDate}>{formatDate(order.paidAt)}</span>
                            </div>
                        </div>
                    )}
                    {order.updatedAt !== order.createdAt && (
                        <div className={styles.timelineItem}>
                            <div className={styles.timelineDot} />
                            <div className={styles.timelineContent}>
                                <span className={styles.timelineTitle}>Last Updated</span>
                                <span className={styles.timelineDate}>{formatDate(order.updatedAt)}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
