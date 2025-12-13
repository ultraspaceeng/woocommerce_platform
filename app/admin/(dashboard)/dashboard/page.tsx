'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    FiDollarSign, FiShoppingCart, FiPackage, FiUsers,
    FiTrendingUp, FiTrendingDown, FiArrowRight, FiClock
} from 'react-icons/fi';
import { dashboardApi, ordersApi } from '@/lib/services/api';
import { DashboardMetrics, Order } from '@/types';
import styles from './page.module.css';

export default function DashboardPage() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [metricsRes, ordersRes] = await Promise.all([
                    dashboardApi.getMetrics(),
                    ordersApi.getAll({ limit: 5 } as Parameters<typeof ordersApi.getAll>[0]),
                ]);
                setMetrics(metricsRes.data.data);
                setRecentOrders(ordersRes.data.data.orders || []);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    if (loading) {
        return <div className={styles.loading}>Loading dashboard...</div>;
    }

    const maxSale = Math.max(...(metrics?.weeklySales.map(d => d.amount) || [1]), 1);

    return (
        <div className={styles.page}>
            {/* Page Header */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Dashboard</h1>
                    <p className={styles.pageSubtitle}>Welcome back! Here&apos;s what&apos;s happening with your store.</p>
                </div>
                <div className={styles.headerActions}>
                    <Link href="/admin/products/new" className={styles.primaryBtn}>
                        <FiPackage size={16} />
                        Add Product
                    </Link>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                    <div className={styles.metricHeader}>
                        <div className={`${styles.metricIcon} ${styles.iconPurple}`}>
                            <FiDollarSign size={20} />
                        </div>
                        {/* <div className={`${styles.metricTrend} ${styles.trendUp}`}>
                            <FiTrendingUp size={14} />
                            +12.5%
                        </div> */}
                    </div>
                    <div className={styles.metricValue}>{formatCurrency(metrics?.netSales || 0)}</div>
                    <div className={styles.metricLabel}>Total Revenue</div>
                </div>

                <div className={styles.metricCard}>
                    <div className={styles.metricHeader}>
                        <div className={`${styles.metricIcon} ${styles.iconBlue}`}>
                            <FiShoppingCart size={20} />
                        </div>
                        {/* <div className={`${styles.metricTrend} ${styles.trendUp}`}>
                            <FiTrendingUp size={14} />
                            +8.2%
                        </div> */}
                    </div>
                    <div className={styles.metricValue}>{metrics?.totalOrders || 0}</div>
                    <div className={styles.metricLabel}>Total Orders</div>
                </div>

                <div className={styles.metricCard}>
                    <div className={styles.metricHeader}>
                        <div className={`${styles.metricIcon} ${styles.iconGreen}`}>
                            <FiPackage size={20} />
                        </div>
                        {/* <div className={`${styles.metricTrend} ${styles.trendDown}`}>
                            <FiTrendingDown size={14} />
                            -3.1%
                        </div> */}
                    </div>
                    <div className={styles.metricValue}>{metrics?.ordersFulfilled || 0}</div>
                    <div className={styles.metricLabel}>Fulfilled Orders</div>
                </div>

                <div className={styles.metricCard}>
                    <div className={styles.metricHeader}>
                        <div className={`${styles.metricIcon} ${styles.iconOrange}`}>
                            <FiUsers size={20} />
                        </div>
                        {/* <div className={`${styles.metricTrend} ${styles.trendUp}`}>
                            <FiTrendingUp size={14} />
                            +15.3%
                        </div> */}
                    </div>
                    <div className={styles.metricValue}>{metrics?.totalUsers || 0}</div>
                    <div className={styles.metricLabel}>Customers</div>
                </div>
            </div>

            {/* Charts and Tables Row */}
            <div className={styles.contentGrid}>
                {/* Revenue Chart */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Revenue Overview</h2>
                        <span className={styles.cardPeriod}>Last 7 days</span>
                    </div>
                    <div className={styles.chart}>
                        <div className={styles.chartBars}>
                            {metrics?.weeklySales.map((day, i) => (
                                <div key={i} className={styles.chartBarWrapper}>
                                    <div
                                        className={styles.chartBar}
                                        style={{ height: `${Math.max((day.amount / maxSale) * 100, 4)}%` }}
                                    />
                                    <span className={styles.chartLabel}>
                                        {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Orders */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Recent Orders</h2>
                        <Link href="/admin/orders" className={styles.viewAllLink}>
                            View all <FiArrowRight size={14} />
                        </Link>
                    </div>
                    <div className={styles.ordersList}>
                        {recentOrders.length === 0 ? (
                            <div className={styles.emptyOrders}>
                                <FiClock size={24} />
                                <p>No orders yet</p>
                            </div>
                        ) : (
                            recentOrders.map((order) => (
                                <div key={order._id} className={styles.orderItem}>
                                    <div className={styles.orderInfo}>
                                        <div className={styles.orderId}>{order.orderId}</div>
                                        <div className={styles.orderCustomer}>{order.userDetails.name}</div>
                                    </div>
                                    <div className={styles.orderDetails}>
                                        <div className={styles.orderAmount}>{formatCurrency(order.totalAmount)}</div>
                                        <div className={styles.orderDate}>{formatDate(order.createdAt)}</div>
                                    </div>
                                    <span className={`${styles.orderStatus} ${styles[order.fulfillmentStatus]}`}>
                                        {order.fulfillmentStatus}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className={styles.quickStats}>
                <div className={styles.quickStatCard}>
                    <div className={styles.quickStatIcon}>
                        <FiClock size={20} />
                    </div>
                    <div>
                        <div className={styles.quickStatValue}>{metrics?.ordersUnfulfilled || 0}</div>
                        <div className={styles.quickStatLabel}>Pending Orders</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
