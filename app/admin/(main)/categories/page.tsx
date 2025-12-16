'use client';

import { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiTag, FiFolder, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { categoriesApi } from '@/lib/services/api';
import styles from './page.module.css';

interface Category {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    createdAt: string;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [saving, setSaving] = useState(false);

    const fetchCategories = async () => {
        try {
            const response = await categoriesApi.getAll();
            setCategories(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const openModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({ name: category.name, description: category.description || '' });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', description: '' });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCategory(null);
        setFormData({ name: '', description: '' });
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) return;
        setSaving(true);

        try {
            if (editingCategory) {
                await categoriesApi.update(editingCategory._id, formData);
            } else {
                await categoriesApi.create(formData);
            }
            await fetchCategories();
            closeModal();
        } catch (error) {
            console.error('Failed to save category:', error);
            toast.error('Failed to save category');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return;

        try {
            await categoriesApi.delete(id);
            await fetchCategories();
        } catch (error) {
            console.error('Failed to delete category:', error);
            toast.error('Failed to delete category');
        }
    };

    if (loading) {
        return <div className={styles.loading}>Loading categories...</div>;
    }

    return (
        <div className={styles.page}>
            {/* Page Header */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Categories</h1>
                    <p className={styles.pageSubtitle}>Organize your products into categories</p>
                </div>
                <button className={styles.primaryBtn} onClick={() => openModal()}>
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
            {categories.length === 0 ? (
                <div className={styles.emptyState}>
                    <FiTag size={48} />
                    <h3>No categories yet</h3>
                    <p>Create your first category to organize products</p>
                    <button className={styles.primaryBtn} onClick={() => openModal()}>
                        <FiPlus size={16} />
                        Add Category
                    </button>
                </div>
            ) : (
                <div className={styles.categoriesGrid}>
                    {categories.map((category) => (
                        <div key={category._id} className={styles.categoryCard}>
                            <div className={styles.categoryIcon}>
                                <FiTag size={24} />
                            </div>
                            <div className={styles.categoryInfo}>
                                <h3 className={styles.categoryName}>{category.name}</h3>
                                <span className={styles.categorySlug}>/{category.slug}</span>
                                {category.description && (
                                    <p className={styles.categoryDescription}>{category.description}</p>
                                )}
                            </div>
                            <div className={styles.categoryActions}>
                                <button className={styles.actionBtn} onClick={() => openModal(category)}>
                                    <FiEdit2 size={16} />
                                </button>
                                <button
                                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                    onClick={() => handleDelete(category._id)}
                                >
                                    <FiTrash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Category Modal */}
            {showModal && (
                <div className={styles.modalOverlay} onClick={closeModal}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>
                                {editingCategory ? 'Edit Category' : 'Add Category'}
                            </h2>
                            <button className={styles.closeBtn} onClick={closeModal}>
                                <FiX size={20} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Category Name</label>
                                <input
                                    type="text"
                                    className={styles.modalInput}
                                    placeholder="e.g., Electronics"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    autoFocus
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Description (optional)</label>
                                <textarea
                                    className={styles.modalTextarea}
                                    placeholder="Brief description of this category"
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={closeModal}>Cancel</button>
                            <button
                                className={styles.submitBtn}
                                onClick={handleSubmit}
                                disabled={saving || !formData.name.trim()}
                            >
                                {saving ? 'Saving...' : editingCategory ? 'Update Category' : 'Add Category'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
