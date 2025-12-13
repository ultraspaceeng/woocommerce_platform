'use client';

import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiTag, FiFolder } from 'react-icons/fi';
import styles from './page.module.css';

interface Category {
    id: string;
    name: string;
    slug: string;
    productCount: number;
}

export default function CategoriesPage() {
    const [categories] = useState<Category[]>([
        { id: '1', name: 'Electronics', slug: 'electronics', productCount: 12 },
        { id: '2', name: 'Clothing', slug: 'clothing', productCount: 24 },
        { id: '3', name: 'Accessories', slug: 'accessories', productCount: 8 },
        { id: '4', name: 'Home & Living', slug: 'home-living', productCount: 15 },
    ]);
    const [showModal, setShowModal] = useState(false);
    const [newCategory, setNewCategory] = useState('');

    const handleAddCategory = () => {
        if (newCategory.trim()) {
            // API call would go here
            setNewCategory('');
            setShowModal(false);
        }
    };

    return (
        <div className={styles.page}>
            {/* Page Header */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Categories</h1>
                    <p className={styles.pageSubtitle}>Organize your products into categories</p>
                </div>
                <button className={styles.primaryBtn} onClick={() => setShowModal(true)}>
                    <FiPlus size={16} />
                    Add Category
                </button>
            </div>

            {/* Stats */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}><FiFolder size={20} /></div>
                    <div className={styles.statValue}>{categories.length}</div>
                    <div className={styles.statLabel}>Total Categories</div>
                </div>
            </div>

            {/* Categories Grid */}
            <div className={styles.categoriesGrid}>
                {categories.map((category) => (
                    <div key={category.id} className={styles.categoryCard}>
                        <div className={styles.categoryIcon}>
                            <FiTag size={24} />
                        </div>
                        <div className={styles.categoryInfo}>
                            <h3 className={styles.categoryName}>{category.name}</h3>
                            <span className={styles.categorySlug}>/{category.slug}</span>
                        </div>
                        <div className={styles.categoryCount}>
                            {category.productCount} products
                        </div>
                        <div className={styles.categoryActions}>
                            <button className={styles.actionBtn}><FiEdit2 size={16} /></button>
                            <button className={`${styles.actionBtn} ${styles.deleteBtn}`}><FiTrash2 size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Category Modal */}
            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.modalTitle}>Add Category</h2>
                        <input
                            type="text"
                            className={styles.modalInput}
                            placeholder="Category name"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            autoFocus
                        />
                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                            <button className={styles.submitBtn} onClick={handleAddCategory}>Add Category</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
