'use client';

import { useEffect, useState } from 'react';
import { FiSearch, FiAlertTriangle, FiPackage, FiCheckCircle, FiEdit2 } from 'react-icons/fi';
import { productsApi } from '@/lib/services/api';
import { Product } from '@/types';
import styles from './page.module.css';

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await productsApi.getAll({ limit: 100, type: 'physical' } as Parameters<typeof productsApi.getAll>[0]);
                setProducts(response.data.data.products);
            } catch (error) {
                console.error('Failed to fetch products:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const getStockStatus = (stock: number) => {
        if (stock <= 0) return 'out';
        if (stock <= 10) return 'low';
        return 'in';
    };

    const filteredProducts = products.filter(p => {
        const stock = p.inventory?.stock || 0;
        const status = getStockStatus(stock);
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.inventory?.sku?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' ||
            (filter === 'low' && status === 'low') ||
            (filter === 'out' && status === 'out');
        return matchesSearch && matchesFilter;
    });

    const stats = {
        total: products.length,
        inStock: products.filter(p => (p.inventory?.stock || 0) > 10).length,
        lowStock: products.filter(p => {
            const stock = p.inventory?.stock || 0;
            return stock > 0 && stock <= 10;
        }).length,
        outOfStock: products.filter(p => (p.inventory?.stock || 0) <= 0).length,
    };

    return (
        <div className={styles.page}>
            {/* Page Header */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Inventory</h1>
                    <p className={styles.pageSubtitle}>Track and manage stock levels</p>
                </div>
            </div>

            {/* Stats */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon}`}><FiPackage size={20} /></div>
                    <div className={styles.statValue}>{stats.total}</div>
                    <div className={styles.statLabel}>Products</div>
                </div>
                <div className={`${styles.statCard} ${styles.statSuccess}`}>
                    <div className={styles.statIcon}><FiCheckCircle size={20} /></div>
                    <div className={styles.statValue}>{stats.inStock}</div>
                    <div className={styles.statLabel}>In Stock</div>
                </div>
                <div className={`${styles.statCard} ${styles.statWarning}`}>
                    <div className={styles.statIcon}><FiAlertTriangle size={20} /></div>
                    <div className={styles.statValue}>{stats.lowStock}</div>
                    <div className={styles.statLabel}>Low Stock</div>
                </div>
                <div className={`${styles.statCard} ${styles.statDanger}`}>
                    <div className={styles.statIcon}><FiAlertTriangle size={20} /></div>
                    <div className={styles.statValue}>{stats.outOfStock}</div>
                    <div className={styles.statLabel}>Out of Stock</div>
                </div>
            </div>

            {/* Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.searchWrapper}>
                    <FiSearch size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search by name or SKU..."
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className={styles.filters}>
                    <button
                        className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                    <button
                        className={`${styles.filterBtn} ${filter === 'low' ? styles.active : ''}`}
                        onClick={() => setFilter('low')}
                    >
                        Low Stock
                    </button>
                    <button
                        className={`${styles.filterBtn} ${filter === 'out' ? styles.active : ''}`}
                        onClick={() => setFilter('out')}
                    >
                        Out of Stock
                    </button>
                </div>
            </div>

            {/* Inventory Table */}
            <div className={styles.tableCard}>
                {loading ? (
                    <div className={styles.loading}>Loading inventory...</div>
                ) : filteredProducts.length === 0 ? (
                    <div className={styles.empty}>
                        <FiPackage size={48} />
                        <h3>No products found</h3>
                        <p>Add physical products to track inventory</p>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>SKU</th>
                                <th>Stock</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((product) => {
                                const stock = product.inventory?.stock || 0;
                                const status = getStockStatus(stock);
                                return (
                                    <tr key={product._id}>
                                        <td>
                                            <span className={styles.productName}>{product.title}</span>
                                        </td>
                                        <td>
                                            <span className={styles.sku}>{product.inventory?.sku || '-'}</span>
                                        </td>
                                        <td>
                                            <span className={`${styles.stock} ${styles[status]}`}>{stock}</span>
                                        </td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[status]}`}>
                                                {status === 'out' ? 'Out of Stock' : status === 'low' ? 'Low Stock' : 'In Stock'}
                                            </span>
                                        </td>
                                        <td>
                                            <button className={styles.editBtn}>
                                                <FiEdit2 size={14} />
                                                Update
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
