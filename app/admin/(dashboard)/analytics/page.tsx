'use client';

import { useEffect, useState } from 'react';
import {
    FiTrendingUp, FiDollarSign, FiShoppingCart, FiUsers,
    FiCalendar, FiBarChart2, FiPieChart
} from 'react-icons/fi';
import { dashboardApi } from '@/lib/services/api';
import { DashboardMetrics } from '@/types';
import styles from './page.module.css';

export default function AnalyticsPage() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('7d');

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await dashboardApi.getMetrics();
                setMetrics(response.data.data);
            } catch (error) {
                console.error('Failed to fetch metrics:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, [period]);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);

    if (loading) {
        return <div className={styles.loading}>Loading analytics...</div>;
    }

    const maxSale = Math.max(...(metrics?.weeklySales.map(d => d.amount) || [1]), 1);

    return (
        <div className={styles.page}>
            {/* Page Header */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Analytics</h1>
                    <p className={styles.pageSubtitle}>Track your store performance</p>
                </div>
                <div className={styles.periodSelector}>
                    <button
                        className={`${styles.periodBtn} ${period === '7d' ? styles.active : ''}`}
                        onClick={() => setPeriod('7d')}
                    >
                        7 Days
                    </button>
                    <button
                        className={`${styles.periodBtn} ${period === '30d' ? styles.active : ''}`}
                        onClick={() => setPeriod('30d')}
                    >
                        30 Days
                    </button>
                    <button
                        className={`${styles.periodBtn} ${period === '90d' ? styles.active : ''}`}
                        onClick={() => setPeriod('90d')}
                    >
                        90 Days
                    </button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className={styles.overviewGrid}>
                <div className={styles.overviewCard}>
                    <div className={styles.cardHeader}>
                        <div className={`${styles.cardIcon} ${styles.iconPurple}`}>
                            <FiDollarSign size={20} />
                        </div>
                        <div className={styles.cardTrend}>
                            <FiTrendingUp size={14} />
                            +12.5%
                        </div>
                    </div>
                    <div className={styles.cardValue}>{formatCurrency(metrics?.netSales || 0)}</div>
                    <div className={styles.cardLabel}>Total Revenue</div>
                    <div className={styles.miniChart}>
                        {metrics?.weeklySales.map((day, i) => (
                            <div
                                key={i}
                                className={styles.miniBar}
                                style={{ height: `${Math.max((day.amount / maxSale) * 100, 10)}%` }}
                            />
                        ))}
                    </div>
                </div>

                <div className={styles.overviewCard}>
                    <div className={styles.cardHeader}>
                        <div className={`${styles.cardIcon} ${styles.iconBlue}`}>
                            <FiShoppingCart size={20} />
                        </div>
                        <div className={styles.cardTrend}>
                            <FiTrendingUp size={14} />
                            +8.2%
                        </div>
                    </div>
                    <div className={styles.cardValue}>{metrics?.totalOrders || 0}</div>
                    <div className={styles.cardLabel}>Total Orders</div>
                </div>

                <div className={styles.overviewCard}>
                    <div className={styles.cardHeader}>
                        <div className={`${styles.cardIcon} ${styles.iconGreen}`}>
                            <FiUsers size={20} />
                        </div>
                        <div className={styles.cardTrend}>
                            <FiTrendingUp size={14} />
                            +15.3%
                        </div>
                    </div>
                    <div className={styles.cardValue}>{metrics?.totalUsers || 0}</div>
                    <div className={styles.cardLabel}>Customers</div>
                </div>

                <div className={styles.overviewCard}>
                    <div className={styles.cardHeader}>
                        <div className={`${styles.cardIcon} ${styles.iconOrange}`}>
                            <FiCalendar size={20} />
                        </div>
                    </div>
                    <div className={styles.cardValue}>
                        {formatCurrency((metrics?.netSales || 0) / Math.max(metrics?.totalOrders || 1, 1))}
                    </div>
                    <div className={styles.cardLabel}>Avg. Order Value</div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className={styles.chartsGrid}>
                {/* Revenue Chart */}
                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <div className={styles.chartInfo}>
                            <h3 className={styles.chartTitle}>Revenue Trend</h3>
                            <p className={styles.chartSubtitle}>Daily revenue over time</p>
                        </div>
                        <div className={styles.chartIcon}><FiBarChart2 size={20} /></div>
                    </div>
                    <div className={styles.barChart}>
                        {metrics?.weeklySales.map((day, i) => (
                            <div key={i} className={styles.barColumn}>
                                <div
                                    className={styles.bar}
                                    style={{ height: `${Math.max((day.amount / maxSale) * 100, 4)}%` }}
                                >
                                    <span className={styles.barTooltip}>{formatCurrency(day.amount)}</span>
                                </div>
                                <span className={styles.barLabel}>
                                    {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Order Status Distribution */}
                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <div className={styles.chartInfo}>
                            <h3 className={styles.chartTitle}>Order Status</h3>
                            <p className={styles.chartSubtitle}>Fulfillment breakdown</p>
                        </div>
                        <div className={styles.chartIcon}><FiPieChart size={20} /></div>
                    </div>
                    <div className={styles.statusList}>
                        <div className={styles.statusItem}>
                            <div className={`${styles.statusDot} ${styles.dotPending}`} />
                            <span className={styles.statusLabel}>Pending</span>
                            <span className={styles.statusValue}>{metrics?.ordersUnfulfilled || 0}</span>
                        </div>
                        <div className={styles.statusItem}>
                            <div className={`${styles.statusDot} ${styles.dotProcessing}`} />
                            <span className={styles.statusLabel}>Processing</span>
                            <span className={styles.statusValue}>0</span>
                        </div>
                        <div className={styles.statusItem}>
                            <div className={`${styles.statusDot} ${styles.dotShipped}`} />
                            <span className={styles.statusLabel}>Shipped</span>
                            <span className={styles.statusValue}>0</span>
                        </div>
                        <div className={styles.statusItem}>
                            <div className={`${styles.statusDot} ${styles.dotFulfilled}`} />
                            <span className={styles.statusLabel}>Fulfilled</span>
                            <span className={styles.statusValue}>{metrics?.ordersFulfilled || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
