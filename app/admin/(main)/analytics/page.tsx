'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
    FiDollarSign, FiShoppingCart, FiUsers, FiCalendar, FiPieChart
} from 'react-icons/fi';
import { dashboardApi } from '@/lib/services/api';
import { DashboardMetrics } from '@/types';
import { useCurrency } from '@/lib/hooks/use-currency';
import styles from './page.module.css';

// Dynamic import Recharts
const BarChart: any = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const Bar: any = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });
const XAxis: any = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis: any = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const Tooltip: any = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer: any = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });

export default function AnalyticsPage() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const { priceInCurrency }: any = useCurrency();

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
    }, []);

    const formatCurrency = (amount: number) => priceInCurrency(amount);

    if (loading) {
        return <div className={styles.loading}>Loading analytics...</div>;
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
                    <h1 className={styles.pageTitle}>Analytics</h1>
                    <p className={styles.pageSubtitle}>Track your store performance</p>
                </div>
            </div>

            {/* Overview Cards */}
            <div className={styles.overviewGrid}>
                <div className={styles.overviewCard}>
                    <div className={styles.cardHeader}>
                        <div className={`${styles.cardIcon} ${styles.iconPurple}`}>
                            <FiDollarSign size={20} />
                        </div>
                    </div>
                    <div className={styles.cardValue}>{formatCurrency(metrics?.netSales || 0)}</div>
                    <div className={styles.cardLabel}>Total Revenue</div>
                </div>

                <div className={styles.overviewCard}>
                    <div className={styles.cardHeader}>
                        <div className={`${styles.cardIcon} ${styles.iconBlue}`}>
                            <FiShoppingCart size={20} />
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
                    <div className={styles.cardValue}>{formatCurrency(metrics?.averageOrderValue || 0)}</div>
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
                            <p className={styles.chartSubtitle}>
                                Last 7 days • {formatCurrency(metrics?.weekTotalRevenue || 0)} total
                            </p>
                        </div>
                    </div>
                    <div style={{ width: '100%', height: 200 }}>
                        {chartData.length > 0 && (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={(v: any) => `₦${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                                        formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                                        labelStyle={{ color: '#a1a1aa' }}
                                    />
                                    <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
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
