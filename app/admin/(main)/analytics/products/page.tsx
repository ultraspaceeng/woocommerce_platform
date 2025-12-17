'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
    FiDollarSign, FiEye, FiDownload, FiShoppingBag, FiPackage,
    FiTrendingUp, FiArrowUp, FiArrowDown
} from 'react-icons/fi';
import { analyticsApi } from '@/lib/services/api';
import styles from './page.module.css';

interface ProductAnalytics {
    _id: string;
    title: string;
    slug: string;
    type: 'physical' | 'digital';
    price: number;
    discountedPrice?: number;
    totalViews: number;
    totalSolds: number;
    totalDownloads: number;
    totalSales: number;
    assets?: string[];
}

interface AnalyticsTotals {
    totalRevenue: number;
    totalViews: number;
    totalPhysicalSold: number;
    totalDigitalDownloads: number;
    productCount: number;
}

export default function ProductAnalyticsPage() {
    const [products, setProducts] = useState<ProductAnalytics[]>([]);
    const [totals, setTotals] = useState<AnalyticsTotals | null>(null);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<string>('totalSales');

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const response = await analyticsApi.getProductAnalytics({ sortBy, limit: 50 });
                if (response.data.success) {
                    setProducts(response.data.data.products);
                    setTotals(response.data.data.totals);
                }
            } catch (error) {
                console.error('Failed to fetch product analytics:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [sortBy]);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);

    const formatCount = (count: number) => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return count.toString();
    };

    if (loading) {
        return <div className={styles.loading}>Loading product analytics...</div>;
    }

    return (
        <div className={styles.page}>
            {/* Page Header */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Product Analytics</h1>
                    <p className={styles.pageSubtitle}>Track individual product performance and revenue</p>
                </div>
            </div>

            {/* Totals Overview */}
            <div className={styles.totalsGrid}>
                <div className={styles.totalCard}>
                    <div className={`${styles.totalIcon} ${styles.iconPurple}`}>
                        <FiDollarSign size={24} />
                    </div>
                    <div className={styles.totalInfo}>
                        <span className={styles.totalValue}>{formatCurrency(totals?.totalRevenue || 0)}</span>
                        <span className={styles.totalLabel}>Total Product Revenue</span>
                    </div>
                </div>

                <div className={styles.totalCard}>
                    <div className={`${styles.totalIcon} ${styles.iconBlue}`}>
                        <FiEye size={24} />
                    </div>
                    <div className={styles.totalInfo}>
                        <span className={styles.totalValue}>{formatCount(totals?.totalViews || 0)}</span>
                        <span className={styles.totalLabel}>Total Views</span>
                    </div>
                </div>

                <div className={styles.totalCard}>
                    <div className={`${styles.totalIcon} ${styles.iconGreen}`}>
                        <FiShoppingBag size={24} />
                    </div>
                    <div className={styles.totalInfo}>
                        <span className={styles.totalValue}>{formatCount(totals?.totalPhysicalSold || 0)}</span>
                        <span className={styles.totalLabel}>Physical Items Sold</span>
                    </div>
                </div>

                <div className={styles.totalCard}>
                    <div className={`${styles.totalIcon} ${styles.iconOrange}`}>
                        <FiDownload size={24} />
                    </div>
                    <div className={styles.totalInfo}>
                        <span className={styles.totalValue}>{formatCount(totals?.totalDigitalDownloads || 0)}</span>
                        <span className={styles.totalLabel}>Digital Downloads</span>
                    </div>
                </div>
            </div>

            {/* Products Table */}
            <div className={styles.tableCard}>
                <div className={styles.tableHeader}>
                    <h2 className={styles.tableTitle}>
                        <FiTrendingUp className={styles.titleIcon} />
                        Product Performance
                    </h2>
                    <div className={styles.sortControls}>
                        <label className={styles.sortLabel}>Sort by:</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className={styles.sortSelect}
                        >
                            <option value="totalSales">Revenue</option>
                            <option value="totalViews">Views</option>
                            <option value="totalSolds">Physical Sold</option>
                            <option value="totalDownloads">Downloads</option>
                        </select>
                    </div>
                </div>

                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Type</th>
                                <th className={styles.numericCol}>Views</th>
                                <th className={styles.numericCol}>Sold/Downloads</th>
                                <th className={styles.numericCol}>Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product, index) => (
                                <tr key={product._id}>
                                    <td>
                                        <div className={styles.productCell}>
                                            <span className={styles.rank}>#{index + 1}</span>
                                            <div className={styles.productImage}>
                                                {product.assets && product.assets[0] ? (
                                                    <Image
                                                        src={product.assets[0]}
                                                        alt={product.title}
                                                        width={40}
                                                        height={40}
                                                        className={styles.thumbnail}
                                                    />
                                                ) : (
                                                    <div className={styles.noImage}>
                                                        <FiPackage size={16} />
                                                    </div>
                                                )}
                                            </div>
                                            <Link href={`/admin/products/${product._id}`} className={styles.productName}>
                                                {product.title}
                                            </Link>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`${styles.typeBadge} ${product.type === 'digital' ? styles.digitalBadge : styles.physicalBadge}`}>
                                            {product.type === 'digital' ? (
                                                <><FiDownload size={12} /> Digital</>
                                            ) : (
                                                <><FiPackage size={12} /> Physical</>
                                            )}
                                        </span>
                                    </td>
                                    <td className={styles.numericCol}>
                                        <span className={styles.statValue}>
                                            <FiEye className={styles.statIcon} />
                                            {formatCount(product.totalViews)}
                                        </span>
                                    </td>
                                    <td className={styles.numericCol}>
                                        <span className={styles.statValue}>
                                            {product.type === 'digital' ? (
                                                <><FiDownload className={styles.statIcon} /> {formatCount(product.totalDownloads)}</>
                                            ) : (
                                                <><FiShoppingBag className={styles.statIcon} /> {formatCount(product.totalSolds)}</>
                                            )}
                                        </span>
                                    </td>
                                    <td className={styles.numericCol}>
                                        <span className={styles.revenueValue}>
                                            {formatCurrency(product.totalSales)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {products.length === 0 && (
                    <div className={styles.emptyState}>
                        <FiPackage size={48} />
                        <p>No product analytics data yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
