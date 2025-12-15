'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
    FiDollarSign, FiShoppingCart, FiPackage, FiUsers,
    FiArrowRight, FiClock, FiEye, FiDownload
} from 'react-icons/fi';
import { dashboardApi, ordersApi, analyticsApi } from '@/lib/services/api';
import { DashboardMetrics, Order } from '@/types';
import styles from './page.module.css';

// Dynamic import Recharts
const BarChart: any = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const Bar: any = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });
const XAxis: any = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis: any = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const Tooltip: any = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer: any = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });

export default function DashboardPage() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState<{ totalViews: number; totalDownloads: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [metricsRes, ordersRes, statsRes] = await Promise.all([
                    dashboardApi.getMetrics(),
                    ordersApi.getAll({ limit: 5 } as Parameters<typeof ordersApi.getAll>[0]),
                    analyticsApi.getStats(),
                ]);
                setMetrics(metricsRes.data.data);
                setRecentOrders(ordersRes.data.data.orders || []);
                setStats(statsRes.data.data);
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

    // Prepare chart data
    const chartData = (metrics?.weeklySales || []).map(day => ({
        ...day,
        day: new Date(day.date).toLocaleDateString('en', { weekday: 'short' })
    }));

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
                    </div>
                    <div className={styles.metricValue}>{formatCurrency(metrics?.netSales || 0)}</div>
                    <div className={styles.metricLabel}>Total Revenue</div>
                </div>

                <div className={styles.metricCard}>
                    <div className={styles.metricHeader}>
                        <div className={`${styles.metricIcon} ${styles.iconBlue}`}>
                            <FiShoppingCart size={20} />
                        </div>
                    </div>
                    <div className={styles.metricValue}>{metrics?.totalOrders || 0}</div>
                    <div className={styles.metricLabel}>Total Orders</div>
                </div>

                <div className={styles.metricCard}>
                    <div className={styles.metricHeader}>
                        <div className={`${styles.metricIcon} ${styles.iconGreen}`}>
                            <FiPackage size={20} />
                        </div>
                    </div>
                    <div className={styles.metricValue}>{metrics?.ordersFulfilled || 0}</div>
                    <div className={styles.metricLabel}>Fulfilled Orders</div>
                </div>

                <div className={styles.metricCard}>
                    <div className={styles.metricHeader}>
                        <div className={`${styles.metricIcon} ${styles.iconOrange}`}>
                            <FiUsers size={20} />
                        </div>
                    </div>
                    <div className={styles.metricValue}>{metrics?.totalUsers || 0}</div>
                    <div className={styles.metricLabel}>Customers</div>
                </div>

                <div className={styles.metricCard}>
                    <div className={styles.metricHeader}>
                        <div className={`${styles.metricIcon} ${styles.iconBlue}`}>
                            <FiEye size={20} />
                        </div>
                    </div>
                    <div className={styles.metricValue}>{stats?.totalViews?.toLocaleString() || 0}</div>
                    <div className={styles.metricLabel}>Total Views</div>
                </div>

                <div className={styles.metricCard}>
                    <div className={styles.metricHeader}>
                        <div className={`${styles.metricIcon} ${styles.iconPurple}`}>
                            <FiDownload size={20} />
                        </div>
                    </div>
                    <div className={styles.metricValue}>{stats?.totalDownloads?.toLocaleString() || 0}</div>
                    <div className={styles.metricLabel}>Total Downloads</div>
                </div>
            </div>

            {/* Charts and Tables Row */}
            <div className={styles.contentGrid}>
                {/* Revenue Chart */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Revenue (Last 7 Days)</h2>
                        <span className={styles.cardPeriod}>{formatCurrency(metrics?.weekTotalRevenue || 0)} total</span>
                    </div>
                    <div style={{ width: '100%', height: 180 }}>
                        {chartData.length > 0 && (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={(v: any) => `₦${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                                        formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                                        labelStyle={{ color: '#a1a1aa' }}
                                    />
                                    <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
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
