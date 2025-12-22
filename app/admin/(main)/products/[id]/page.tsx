'use client';

import { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    FiArrowLeft, FiPlus, FiX, FiImage, FiUpload,
    FiDollarSign, FiPackage, FiTag, FiGlobe, FiSave, FiFile
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import Button from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { productsApi, categoriesApi } from '@/lib/services/api';
import styles from './page.module.css';

interface Category {
    _id: string;
    name: string;
    slug: string;
}

interface ProductFormData {
    title: string;
    description: string;
    price: string;
    discountedPrice: string;
    type: 'physical' | 'digital';
    category: string;
    sku: string;
    stock: string;
    weight: string;
    brand: string;
    isActive: boolean;
    options: { name: string; values: string }[];
    seoTitle: string;
    seoDescription: string;
    // Digital product fields
    digitalFile: string;
    digitalFileName: string;
    deleteDigitalFile: boolean; // Flag to explicitly delete existing file
    // Product images (base64)
    images: string[];
    videoUrl: string;
}

interface ProductFormPageProps {
    params: Promise<{ id: string }>;
}

export default function ProductFormPage({ params }: ProductFormPageProps) {
    const { id } = use(params);
    const router = useRouter();
    const isNew = id === 'new';
    const fileInputRef = useRef<HTMLInputElement>(null);
    const digitalFileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [categories, setCategories] = useState<Category[]>([]);
    const [formData, setFormData] = useState<ProductFormData>({
        title: '',
        description: '',
        price: '',
        discountedPrice: '',
        type: 'physical',
        category: '',
        sku: '',
        stock: '0',
        weight: '',
        brand: '',
        isActive: true,
        options: [],
        seoTitle: '',
        seoDescription: '',
        digitalFile: '',
        digitalFileName: '',
        deleteDigitalFile: false,
        images: [],
        videoUrl: '',
    });

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await categoriesApi.getAll();
                setCategories(response.data.data || []);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            }
        };
        fetchCategories();
    }, []);

    // Fetch product if editing
    useEffect(() => {
        if (!isNew) {
            const fetchProduct = async () => {
                try {
                    const response = await productsApi.getById(id);
                    const product = response.data.data;
                    setFormData({
                        title: product.title,
                        description: product.description || '',
                        price: product.price.toString(),
                        discountedPrice: product.discountedPrice?.toString() || '',
                        type: product.type,
                        category: product.category || '',
                        sku: product.inventory?.sku || '',
                        stock: product.inventory?.stock?.toString() || '0',
                        weight: product.inventory?.weight?.toString() || '',
                        brand: product.brand || '',
                        isActive: product.isActive,
                        options: product.options?.map((opt: { name: string; values: string[] }) => ({
                            name: opt.name,
                            values: opt.values.join(', '),
                        })) || [],
                        seoTitle: product.seoData?.metaTitle || '',
                        seoDescription: product.seoData?.metaDescription || '',
                        digitalFile: product.digitalFile || '',
                        digitalFileName: product.digitalFileName || '',
                        images: product.assets || [],
                        videoUrl: product.videoUrl || '',
                        deleteDigitalFile: false,
                    });
                } catch (error) {
                    console.error('Failed to fetch product:', error);
                    router.push('/admin/products');
                } finally {
                    setLoading(false);
                }
            };
            fetchProduct();
        }
    }, [id, isNew, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Handle digital file upload
    const handleDigitalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Max 50MB for digital files
        if (file.size > 50 * 1024 * 1024) {
            toast.error('File size must be under 50MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result as string;
            setFormData(prev => ({
                ...prev,
                digitalFile: base64,
                digitalFileName: file.name,
            }));
        };
        reader.readAsDataURL(file);
    };

    const removeDigitalFile = () => {
        setFormData(prev => ({
            ...prev,
            digitalFile: '',
            digitalFileName: '',
            deleteDigitalFile: true, // Mark for explicit deletion
        }));
        if (digitalFileInputRef.current) {
            digitalFileInputRef.current.value = '';
        }
    };

    // Handle product image upload
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        // Max 5 images
        if (formData.images.length + files.length > 5) {
            toast.error('Maximum 5 images allowed');
            return;
        }

        Array.from(files).forEach(file => {
            // Max 5MB per image
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} is too large. Max 5MB per image.`);
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result as string;
                setFormData(prev => ({
                    ...prev,
                    images: [...prev.images, base64],
                }));
            };
            reader.readAsDataURL(file);
        });

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
    };

    const addOption = () => {
        setFormData((prev) => ({
            ...prev,
            options: [...prev.options, { name: '', values: '' }],
        }));
    };

    const removeOption = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            options: prev.options.filter((_, i) => i !== index),
        }));
    };

    const updateOption = (index: number, field: 'name' | 'values', value: string) => {
        setFormData((prev) => ({
            ...prev,
            options: prev.options.map((opt, i) =>
                i === index ? { ...opt, [field]: value } : opt
            ),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const productData: Record<string, unknown> = {
                title: formData.title,
                description: formData.description,
                price: parseFloat(formData.price),
                discountedPrice: formData.discountedPrice ? parseFloat(formData.discountedPrice) : undefined,
                type: formData.type,
                category: formData.category,
                brand: formData.brand,
                inventory: formData.type === 'physical' ? {
                    sku: formData.sku,
                    stock: parseInt(formData.stock) || 0,
                    weight: formData.weight ? parseFloat(formData.weight) : undefined,
                } : undefined,
                isActive: formData.isActive,
                options: formData.options.map((opt) => ({
                    name: opt.name,
                    values: opt.values.split(',').map((v) => v.trim()).filter(Boolean),
                })).filter((opt) => opt.name && opt.values.length > 0),
                seoData: {
                    metaTitle: formData.seoTitle,
                    metaDescription: formData.seoDescription,
                },
                // Product images
                assets: formData.images,
                videoUrl: formData.videoUrl,
            };

            // Digital product data - only include if it's a new file or explicit deletion
            if (formData.type === 'digital') {
                if (formData.deleteDigitalFile) {
                    // Explicit deletion requested by admin
                    productData.deleteDigitalFile = true;
                } else if (formData.digitalFile) {
                    // New file uploaded
                    productData.digitalFile = formData.digitalFile;
                    productData.digitalFileName = formData.digitalFileName;
                }
                // If neither flag is set and no new file, don't include - API will preserve existing
            }

            if (isNew) {
                await productsApi.create(productData);
            } else {
                await productsApi.update(id, productData);
            }

            router.push('/admin/products');
        } catch (error) {
            console.error('Failed to save product:', error);
            toast.error('Failed to save product');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className={styles.loading}>Loading product...</div>;
    }

    const tabs = [
        { id: 'general', label: 'General', icon: FiPackage },
        { id: 'pricing', label: 'Pricing', icon: FiDollarSign },
        { id: 'media', label: 'Media', icon: FiImage },
        { id: 'variants', label: 'Variants', icon: FiTag },
        { id: 'seo', label: 'SEO', icon: FiGlobe },
    ];

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <Link href="/admin/products" className={styles.backBtn}>
                        <FiArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className={styles.pageTitle}>{isNew ? 'Add Product' : 'Edit Product'}</h1>
                        <p className={styles.pageSubtitle}>{isNew ? 'Create a new product' : 'Update product details'}</p>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <div className={styles.statusToggle}>
                        <button
                            type="button"
                            className={`${styles.statusBtn} ${!formData.isActive ? styles.active : ''}`}
                            onClick={() => setFormData(prev => ({ ...prev, isActive: false }))}
                        >
                            Draft
                        </button>
                        <button
                            type="button"
                            className={`${styles.statusBtn} ${formData.isActive ? styles.active : ''}`}
                            onClick={() => setFormData(prev => ({ ...prev, isActive: true }))}
                        >
                            Active
                        </button>
                    </div>
                    <Button onClick={handleSubmit} loading={saving} leftIcon={<FiSave size={16} />}>
                        {isNew ? 'Create Product' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className={styles.formContent}>
                {/* General Tab */}
                {activeTab === 'general' && (
                    <div className={styles.tabContent}>
                        <div className={styles.formGrid}>
                            <div className={styles.formCard}>
                                <h3 className={styles.cardTitle}>Basic Information</h3>
                                <div className={styles.formFields}>
                                    <Input
                                        label="Product Title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="Enter product name"
                                        required
                                    />
                                    <Textarea
                                        label="Description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Describe your product..."
                                        rows={5}
                                    />
                                </div>
                            </div>

                            <div className={styles.formCard}>
                                <h3 className={styles.cardTitle}>Organization</h3>
                                <div className={styles.formFields}>
                                    <div className={styles.typeSelector}>
                                        <label className={styles.fieldLabel}>Product Type</label>
                                        <div className={styles.typeOptions}>
                                            <button
                                                type="button"
                                                className={`${styles.typeOption} ${formData.type === 'physical' ? styles.selected : ''}`}
                                                onClick={() => setFormData(prev => ({ ...prev, type: 'physical' }))}
                                            >
                                                <span className={styles.typeIcon}>📦</span>
                                                <span className={styles.typeLabel}>Physical</span>
                                            </button>
                                            <button
                                                type="button"
                                                className={`${styles.typeOption} ${formData.type === 'digital' ? styles.selected : ''}`}
                                                onClick={() => setFormData(prev => ({ ...prev, type: 'digital' }))}
                                            >
                                                <span className={styles.typeIcon}>💾</span>
                                                <span className={styles.typeLabel}>Digital</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className={styles.selectWrapper}>
                                        <label className={styles.fieldLabel}>Category</label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                            className={styles.select}
                                        >
                                            <option value="">Select a category</option>
                                            {categories.map(cat => (
                                                <option key={cat._id} value={cat.slug}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <Input
                                        label="Brand"
                                        name="brand"
                                        value={formData.brand}
                                        onChange={handleChange}
                                        placeholder="Product brand"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Pricing Tab */}
                {activeTab === 'pricing' && (
                    <div className={styles.tabContent}>
                        <div className={styles.formCard}>
                            <h3 className={styles.cardTitle}>Pricing</h3>
                            <div className={styles.formRow}>
                                <Input
                                    label="Price (₦)"
                                    name="price"
                                    type="number"
                                    value={formData.price}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    required
                                    min="0"
                                    step="0.01"
                                />
                                <Input
                                    label="Compare At Price (₦)"
                                    name="discountedPrice"
                                    type="number"
                                    value={formData.discountedPrice}
                                    onChange={handleChange}
                                    placeholder="Original price"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        {formData.type === 'physical' && (
                            <div className={styles.formCard}>
                                <h3 className={styles.cardTitle}>Inventory</h3>
                                <div className={styles.formRow}>
                                    <Input
                                        label="SKU"
                                        name="sku"
                                        value={formData.sku}
                                        onChange={handleChange}
                                        placeholder="Stock Keeping Unit"
                                    />
                                    <Input
                                        label="Stock Quantity"
                                        name="stock"
                                        type="number"
                                        value={formData.stock}
                                        onChange={handleChange}
                                        min="0"
                                    />
                                    <Input
                                        label="Weight (kg)"
                                        name="weight"
                                        type="number"
                                        value={formData.weight}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                        )}

                        {formData.type === 'digital' && (
                            <div className={styles.formCard}>
                                <h3 className={styles.cardTitle}>Digital File</h3>
                                <p className={styles.fieldDescription}>Upload the file customers will receive after purchase</p>

                                {formData.digitalFileName ? (
                                    <div className={styles.uploadedFile}>
                                        <FiFile size={24} />
                                        <div className={styles.fileInfo}>
                                            <span className={styles.fileName}>{formData.digitalFileName}</span>
                                            <span className={styles.fileSize}>Ready for delivery</span>
                                        </div>
                                        <button type="button" className={styles.removeFileBtn} onClick={removeDigitalFile}>
                                            <FiX size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className={styles.uploadZone} onClick={() => digitalFileInputRef.current?.click()}>
                                        <FiUpload size={32} />
                                        <p>Click to upload digital file</p>
                                        <span>Max 50MB - PDF, ZIP, MP3, MP4, etc.</span>
                                    </div>
                                )}
                                <input
                                    ref={digitalFileInputRef}
                                    type="file"
                                    onChange={handleDigitalFileUpload}
                                    style={{ display: 'none' }}
                                    accept=".pdf,.zip,.rar,.mp3,.mp4,.epub,.mobi,.doc,.docx,.ppt,.pptx"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Media Tab */}
                {activeTab === 'media' && (
                    <div className={styles.tabContent}>
                        <div className={styles.formCard}>
                            <h3 className={styles.cardTitle}>Video</h3>
                            <div className={styles.formFields}>
                                <Input
                                    label="YouTube Video URL"
                                    name="videoUrl"
                                    value={formData.videoUrl}
                                    onChange={handleChange}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    helperText="Embed a YouTube video to showcase your product."
                                />
                            </div>
                        </div>

                        <div className={styles.formCard}>
                            <h3 className={styles.cardTitle}>Product Images</h3>

                            {/* Image Gallery */}
                            {formData.images.length > 0 && (
                                <div className={styles.imageGallery}>
                                    {formData.images.map((img, index) => (
                                        <div key={index} className={styles.imageItem}>
                                            <img src={img} alt={`Product ${index + 1}`} />
                                            <button
                                                type="button"
                                                className={styles.removeImageBtn}
                                                onClick={() => removeImage(index)}
                                            >
                                                <FiX size={14} />
                                            </button>
                                            {index === 0 && <span className={styles.mainBadge}>Main</span>}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Upload Zone */}
                            {formData.images.length < 5 && (
                                <div className={styles.mediaUpload}>
                                    <div className={styles.uploadZone} onClick={() => fileInputRef.current?.click()}>
                                        <FiUpload size={32} />
                                        <p>Click to upload images</p>
                                        <span>{5 - formData.images.length} slots remaining</span>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            )}

                            <p className={styles.mediaNote}>
                                Recommended size: 1024x1024px. Maximum 5 images, 5MB each. Supports JPG, PNG, WebP.
                            </p>
                        </div>
                    </div>
                )}

                {/* Variants Tab */}
                {activeTab === 'variants' && (
                    <div className={styles.tabContent}>
                        <div className={styles.formCard}>
                            <div className={styles.cardHeader}>
                                <h3 className={styles.cardTitle}>Product Options</h3>
                                <button type="button" className={styles.addBtn} onClick={addOption}>
                                    <FiPlus size={16} />
                                    Add Option
                                </button>
                            </div>
                            {formData.options.length === 0 ? (
                                <div className={styles.emptyOptions}>
                                    <p>No options yet. Add options like Size, Color, or Material.</p>
                                </div>
                            ) : (
                                <div className={styles.optionsList}>
                                    {formData.options.map((option, index) => (
                                        <div key={index} className={styles.optionItem}>
                                            <Input
                                                placeholder="Option name (e.g., Size)"
                                                value={option.name}
                                                onChange={(e) => updateOption(index, 'name', e.target.value)}
                                            />
                                            <Input
                                                placeholder="Values (comma separated, e.g., S, M, L, XL)"
                                                value={option.values}
                                                onChange={(e) => updateOption(index, 'values', e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                className={styles.removeBtn}
                                                onClick={() => removeOption(index)}
                                            >
                                                <FiX size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* SEO Tab */}
                {activeTab === 'seo' && (
                    <div className={styles.tabContent}>
                        <div className={styles.formCard}>
                            <h3 className={styles.cardTitle}>Search Engine Optimization</h3>
                            <div className={styles.formFields}>
                                <Input
                                    label="SEO Title"
                                    name="seoTitle"
                                    value={formData.seoTitle}
                                    onChange={handleChange}
                                    placeholder={formData.title || 'Enter SEO title'}
                                    helperText="Recommended: 50-60 characters"
                                />
                                <Textarea
                                    label="SEO Description"
                                    name="seoDescription"
                                    value={formData.seoDescription}
                                    onChange={handleChange}
                                    placeholder="Enter meta description for search engines..."
                                    rows={3}
                                />
                            </div>
                            <div className={styles.seoPreview}>
                                <h4>Search Preview</h4>
                                <div className={styles.previewCard}>
                                    <div className={styles.previewTitle}>
                                        {formData.seoTitle || formData.title || 'Product Title'}
                                    </div>
                                    <div className={styles.previewUrl}>
                                        royal-commerce.com/market/{formData.title?.toLowerCase().replace(/\s+/g, '-') || 'product-slug'}
                                    </div>
                                    <div className={styles.previewDescription}>
                                        {formData.seoDescription || formData.description?.slice(0, 160) || 'Product description will appear here...'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}
