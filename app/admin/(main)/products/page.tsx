'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    FiPlus, FiSearch, FiFilter, FiEdit2, FiTrash2, FiPackage,
    FiMoreVertical, FiEye, FiCopy, FiDownload
} from 'react-icons/fi';
import Button from '@/components/ui/button';
import { productsApi } from '@/lib/services/api';
import { Product } from '@/types';
import { useCurrency } from '@/lib/hooks/use-currency';
import styles from './page.module.css';

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const { priceInCurrency }: any = useCurrency();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const params: Record<string, unknown> = { limit: 100 };
                if (filterType !== 'all') params.type = filterType;
                if (searchQuery) params.search = searchQuery;

                const response = await productsApi.getAll(params as Parameters<typeof productsApi.getAll>[0]);
                setProducts(response.data.data.products);
            } catch (error) {
                console.error('Failed to fetch products:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [filterType, searchQuery]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            await productsApi.delete(id);
            setProducts(products.filter(p => p._id !== id));
        } catch (error) {
            console.error('Failed to delete product:', error);
        }
    };

    const toggleSelectAll = () => {
        if (selectedProducts.length === products.length) {
            setSelectedProducts([]);
        } else {
            setSelectedProducts(products.map(p => p._id));
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedProducts.includes(id)) {
            setSelectedProducts(selectedProducts.filter(i => i !== id));
        } else {
            setSelectedProducts([...selectedProducts, id]);
        }
    };

    const formatPrice = (price: number) => priceInCurrency(price);

    return (
        <div className={styles.page}>
            {/* Page Header */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Products</h1>
                    <p className={styles.pageSubtitle}>Manage your product catalog</p>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.secondaryBtn}>
                        <FiDownload size={16} />
                        Export
                    </button>
                    <Link href="/admin/products/new" className={styles.primaryBtn}>
                        <FiPlus size={16} />
                        Add Product
                    </Link>
                </div>
            </div>

            {/* Filters & Search */}
            <div className={styles.toolbar}>
                <div className={styles.searchWrapper}>
                    <FiSearch size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search products..."
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className={styles.filters}>
                    <button className={styles.filterBtn}>
                        <FiFilter size={16} />
                        Filters
                    </button>
                    <select
                        className={styles.filterSelect}
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="all">All Types</option>
                        <option value="physical">Physical</option>
                        <option value="digital">Digital</option>
                    </select>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedProducts.length > 0 && (
                <div className={styles.bulkActions}>
                    <span className={styles.selectedCount}>{selectedProducts.length} selected</span>
                    <button className={styles.bulkBtn}>Bulk Edit</button>
                    <button className={styles.bulkBtnDanger}>Delete Selected</button>
                </div>
            )}

            {/* Products Table */}
            <div className={styles.tableCard}>
                {loading ? (
                    <div className={styles.loading}>Loading products...</div>
                ) : products.length === 0 ? (
                    <div className={styles.empty}>
                        <FiPackage size={48} />
                        <h3>No products yet</h3>
                        <p>Get started by adding your first product</p>
                        <Link href="/admin/products/new">
                            <Button>Add Product</Button>
                        </Link>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.checkboxCell}>
                                    <input
                                        type="checkbox"
                                        checked={selectedProducts.length === products.length}
                                        onChange={toggleSelectAll}
                                        className={styles.checkbox}
                                    />
                                </th>
                                <th>Product</th>
                                <th>Type</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Status</th>
                                <th className={styles.actionsCell}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product: any) => (
                                <tr key={product._id} className={selectedProducts.includes(product._id) ? styles.selected : ''}>
                                    <td className={styles.checkboxCell}>
                                        <input
                                            type="checkbox"
                                            checked={selectedProducts.includes(product._id)}
                                            onChange={() => toggleSelect(product._id)}
                                            className={styles.checkbox}
                                        />
                                    </td>
                                    <td>
                                        <div className={styles.productCell}>
                                            <div className={styles.productImage}>
                                                {product.assets?.[0] ? (
                                                    <Image src={product.assets[0]} alt={product.title} fill sizes="48px" />
                                                ) : (
                                                    <FiPackage size={20} />
                                                )}
                                            </div>
                                            <div className={styles.productInfo}>
                                                <div className={styles.productTitle}>{product.title}</div>
                                                <div className={styles.productSku}>{product.inventory?.sku || 'No SKU'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`${styles.typeBadge} ${styles[product.type]}`}>
                                            {product.type}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.priceCell}>
                                            <span className={styles.price}>{formatPrice(product.discountedPrice || product.price)}</span>
                                            {product.discountedPrice && (
                                                <span className={styles.originalPrice}>{formatPrice(product.price)}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        {product.type === 'digital' ? (
                                            <span className={styles.stockInfinite}>∞</span>
                                        ) : (
                                            <span className={product.inventory?.stock && product.inventory.stock > 0 ? styles.stockIn : styles.stockOut}>
                                                {product.inventory?.stock || 0}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${product.isActive ? styles.active : styles.inactive}`}>
                                            {product.isActive ? 'Active' : 'Draft'}
                                        </span>
                                    </td>
                                    <td className={styles.actionsCell}>
                                        <div className={styles.actions}>
                                            <Link href={`/market/${product.slug || product._id}`} target="_blank" className={styles.actionBtn} title="View">
                                                <FiEye size={16} />
                                            </Link>
                                            <button className={styles.actionBtn} title="Duplicate">
                                                <FiCopy size={16} />
                                            </button>
                                            <Link href={`/admin/products/${product._id}`} className={styles.actionBtn} title="Edit">
                                                <FiEdit2 size={16} />
                                            </Link>
                                            <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(product._id)} title="Delete">
                                                <FiTrash2 size={16} />
                                            </button>
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
