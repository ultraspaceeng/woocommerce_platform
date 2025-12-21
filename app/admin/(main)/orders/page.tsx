'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    FiSearch, FiFilter, FiDownload, FiEye, FiTruck,
    FiPackage, FiCheckCircle, FiClock, FiMoreVertical
} from 'react-icons/fi';
import { ordersApi } from '@/lib/services/api';
import { Order, FulfillmentStatus } from '@/types';
import { useCurrency } from '@/lib/hooks/use-currency';
import styles from './page.module.css';

const statusColors: Record<string, string> = {
    pending: 'warning',
    paid: 'success',
    failed: 'error',
    unfulfilled: 'warning',
    processing: 'info',
    shipped: 'purple',
    fulfilled: 'success',
};

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [fulfillmentFilter, setFulfillmentFilter] = useState('all');
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const { priceInCurrency }: any = useCurrency();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const params: Record<string, unknown> = { limit: 100 };
                if (paymentFilter !== 'all') params.status = paymentFilter;
                if (fulfillmentFilter !== 'all') params.fulfillment = fulfillmentFilter;

                const response = await ordersApi.getAll(params as Parameters<typeof ordersApi.getAll>[0]);
                setOrders(response.data.data.orders || []);
            } catch (error) {
                console.error('Failed to fetch orders:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [paymentFilter, fulfillmentFilter]);

    const updateFulfillment = async (id: string, status: FulfillmentStatus) => {
        try {
            await ordersApi.updateStatus(id, { fulfillmentStatus: status });
            setOrders(orders.map(o => o._id === id ? { ...o, fulfillmentStatus: status } : o));
        } catch (error) {
            console.error('Failed to update order:', error);
        }
    };

    const formatCurrency = (amount: number) => priceInCurrency(amount);

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const filteredOrders = orders.filter(order =>
        order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.userDetails.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.userDetails.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.fulfillmentStatus === 'unfulfilled').length,
        processing: orders.filter(o => o.fulfillmentStatus === 'processing').length,
        shipped: orders.filter(o => o.fulfillmentStatus === 'shipped').length,
        fulfilled: orders.filter(o => o.fulfillmentStatus === 'fulfilled').length,
    };

    return (
        <div className={styles.page}>
            {/* Page Header */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Orders</h1>
                    <p className={styles.pageSubtitle}>Manage and fulfill customer orders</p>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.secondaryBtn}>
                        <FiDownload size={16} />
                        Export
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <FiPackage className={styles.statIcon} />
                    <div className={styles.statValue}>{stats.total}</div>
                    <div className={styles.statLabel}>Total Orders</div>
                </div>
                <div className={`${styles.statCard} ${styles.statWarning}`}>
                    <FiClock className={styles.statIcon} />
                    <div className={styles.statValue}>{stats.pending}</div>
                    <div className={styles.statLabel}>Pending</div>
                </div>
                <div className={`${styles.statCard} ${styles.statInfo}`}>
                    <FiTruck className={styles.statIcon} />
                    <div className={styles.statValue}>{stats.shipped}</div>
                    <div className={styles.statLabel}>Shipped</div>
                </div>
                <div className={`${styles.statCard} ${styles.statSuccess}`}>
                    <FiCheckCircle className={styles.statIcon} />
                    <div className={styles.statValue}>{stats.fulfilled}</div>
                    <div className={styles.statLabel}>Fulfilled</div>
                </div>
            </div>

            {/* Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.searchWrapper}>
                    <FiSearch size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search orders by ID, customer..."
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className={styles.filters}>
                    <select
                        className={styles.filterSelect}
                        value={paymentFilter}
                        onChange={(e) => setPaymentFilter(e.target.value)}
                    >
                        <option value="all">All Payments</option>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="failed">Failed</option>
                    </select>
                    <select
                        className={styles.filterSelect}
                        value={fulfillmentFilter}
                        onChange={(e) => setFulfillmentFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="unfulfilled">Unfulfilled</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="fulfilled">Fulfilled</option>
                    </select>
                </div>
            </div>

            {/* Orders Table */}
            <div className={styles.tableCard}>
                {loading ? (
                    <div className={styles.loading}>Loading orders...</div>
                ) : filteredOrders.length === 0 ? (
                    <div className={styles.empty}>
                        <FiPackage size={48} />
                        <h3>No orders found</h3>
                        <p>Orders will appear here once customers make purchases</p>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Order</th>
                                <th>Customer</th>
                                <th>Date</th>
                                <th>Total</th>
                                <th>Payment</th>
                                <th>Fulfillment</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order) => (
                                <tr key={order._id}>
                                    <td>
                                        <div className={styles.orderIdCell}>
                                            <span className={styles.orderId}>{order.orderId}</span>
                                            <span className={styles.itemCount}>{order.cartItems.length} item(s)</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.customerCell}>
                                            <span className={styles.customerName}>{order.userDetails.name}</span>
                                            <span className={styles.customerEmail}>{order.userDetails.email}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={styles.dateCell}>{formatDate(order.createdAt)}</span>
                                    </td>
                                    <td>
                                        <span className={styles.totalCell}>{formatCurrency(order.totalAmount)}</span>
                                    </td>
                                    <td>
                                        <span className={`${styles.badge} ${styles[statusColors[order.paymentStatus]]}`}>
                                            {order.paymentStatus}
                                        </span>
                                    </td>
                                    <td>
                                        <select
                                            className={`${styles.fulfillmentSelect} ${styles[statusColors[order.fulfillmentStatus]]}`}
                                            value={order.fulfillmentStatus}
                                            onChange={(e) => updateFulfillment(order._id, e.target.value as FulfillmentStatus)}
                                        >
                                            <option value="unfulfilled">Unfulfilled</option>
                                            <option value="processing">Processing</option>
                                            <option value="shipped">Shipped</option>
                                            <option value="fulfilled">Fulfilled</option>
                                        </select>
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <Link href={`/admin/orders/${order._id}`} className={styles.actionBtn} title="View Details">
                                                <FiEye size={16} />
                                            </Link>
                                            <button className={styles.actionBtn} title="More">
                                                <FiMoreVertical size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
