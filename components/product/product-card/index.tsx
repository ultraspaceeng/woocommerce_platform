'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FiShoppingCart, FiPackage, FiDownload, FiCheck, FiStar, FiClock } from 'react-icons/fi';
import { Product } from '@/types';
import { useCartStore } from '@/lib/stores/cart-store';
import styles from './product-card.module.css';

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const addItem = useCartStore((state) => state.addItem);
    const isInCart = useCartStore((state) => state.isInCart);

    const hasDiscount = product.discountedPrice && product.discountedPrice < product.price;
    const displayPrice = hasDiscount ? product.discountedPrice : product.price;
    const isDigital = product.type === 'digital';
    const inCart = isInCart(product._id);
    const isOutOfStock = product.type === 'physical' && product.inventory?.stock === 0;

    // Calculate discount percentage
    const discountPercentage = hasDiscount
        ? Math.round(((product.price - product.discountedPrice!) / product.price) * 100)
        : 0;

    // Check if product is new (created within last 7 days)
    const isNew = product.createdAt
        ? (Date.now() - new Date(product.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000
        : false;

    // Get available options summary
    const getOptionsPreview = () => {
        if (!product.options || product.options.length === 0) return null;
        const sizes = product.options.find(o => o.name.toLowerCase() === 'size');
        const colors = product.options.find(o => o.name.toLowerCase() === 'color');
        return { sizes, colors };
    };

    const optionsPreview = getOptionsPreview();

    // Truncate description for preview
    const descriptionPreview = product.description
        ? product.description.slice(0, 60) + (product.description.length > 60 ? '...' : '')
        : null;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!inCart || !isDigital) {
            addItem(product, 1);
        }
    };

    const productLink = `/market/${product.slug || product._id}`;

    // Determine button state and text
    const getButtonState = () => {
        if (isOutOfStock) {
            return { text: 'Out of Stock', disabled: true, icon: <FiPackage size={14} /> };
        }
        if (isDigital && inCart) {
            return { text: 'Added', disabled: true, icon: <FiCheck size={14} /> };
        }
        if (isDigital) {
            return { text: 'Add to Cart', disabled: false, icon: <FiDownload size={14} /> };
        }
        return { text: 'Add to Cart', disabled: false, icon: <FiShoppingCart size={14} /> };
    };

    const buttonState = getButtonState();

    return (
        <article className={styles.card}>
            <Link href={productLink} className={styles.cardLink}>
                <div className={styles.imageWrapper}>
                    {product.assets && product.assets.length > 0 ? (
                        <Image
                            src={product.assets[0]}
                            alt={product.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className={styles.image}
                        />
                    ) : (
                        <div className={styles.placeholder}>
                            <FiPackage />
                        </div>
                    )}

                    {/* Badges Container */}
                    <div className={styles.badgeContainer}>
                        {isNew && (
                            <span className={`${styles.badge} ${styles.newBadge}`}>
                                <FiClock size={9} />
                                New
                            </span>
                        )}

                        {isDigital && (
                            <span className={`${styles.badge} ${styles.digitalBadge}`}>
                                <FiDownload size={9} />
                                Digital
                            </span>
                        )}

                        {hasDiscount && (
                            <span className={`${styles.badge} ${styles.saleBadge}`}>
                                -{discountPercentage}%
                            </span>
                        )}

                        {isOutOfStock && (
                            <span className={`${styles.badge} ${styles.outOfStockBadge}`}>
                                Sold Out
                            </span>
                        )}
                    </div>

                    {/* Quick View Overlay */}
                    <div className={styles.overlay}>
                        <span className={styles.viewText}>View Details</span>
                    </div>
                </div>

                <div className={styles.content}>
                    {/* Category & Type Row */}
                    <div className={styles.metaRow}>
                        {product.category && (
                            <span className={styles.category}>{product.category}</span>
                        )}
                        {product.inventory?.sku && (
                            <span className={styles.sku}>SKU: {product.inventory.sku}</span>
                        )}
                    </div>

                    <h3 className={styles.title}>{product.title}</h3>

                    {/* Description Preview */}
                    {descriptionPreview && (
                        <p className={styles.description}>{descriptionPreview}</p>
                    )}

                    {/* Options Preview */}
                    {optionsPreview && (optionsPreview.sizes || optionsPreview.colors) && (
                        <div className={styles.optionsRow}>
                            {optionsPreview.colors && optionsPreview.colors.values.length > 0 && (
                                <div className={styles.colorOptions}>
                                    {optionsPreview.colors.values.slice(0, 4).map((color, i) => (
                                        <span
                                            key={i}
                                            className={styles.colorDot}
                                            style={{ backgroundColor: color.toLowerCase() }}
                                            title={color}
                                        />
                                    ))}
                                    {optionsPreview.colors.values.length > 4 && (
                                        <span className={styles.moreOptions}>
                                            +{optionsPreview.colors.values.length - 4}
                                        </span>
                                    )}
                                </div>
                            )}
                            {optionsPreview.sizes && optionsPreview.sizes.values.length > 0 && (
                                <span className={styles.sizeInfo}>
                                    {optionsPreview.sizes.values.length} sizes
                                </span>
                            )}
                        </div>
                    )}

                    {/* Price Row */}
                    <div className={styles.priceRow}>
                        <div className={styles.priceGroup}>
                            <span className={styles.price}>{formatPrice(displayPrice!)}</span>
                            {hasDiscount && (
                                <span className={styles.originalPrice}>
                                    {formatPrice(product.price)}
                                </span>
                            )}
                        </div>
                        {hasDiscount && (
                            <span className={styles.savings}>
                                Save {formatPrice(product.price - product.discountedPrice!)}
                            </span>
                        )}
                    </div>

                    {/* Stock indicator for physical products */}
                    {product.type === 'physical' && product.inventory?.stock > 0 && product.inventory.stock <= 5 && (
                        <span className={styles.lowStock}>
                            🔥 Only {product.inventory.stock} left!
                        </span>
                    )}
                </div>
            </Link>

            <div className={styles.cardFooter}>
                <button
                    className={`${styles.addToCart} ${buttonState.disabled ? styles.disabled : ''} ${inCart && isDigital ? styles.inCart : ''}`}
                    onClick={handleAddToCart}
                    disabled={buttonState.disabled}
                >
                    {buttonState.icon}
                    {buttonState.text}
                </button>
            </div>
        </article>
    );
}

