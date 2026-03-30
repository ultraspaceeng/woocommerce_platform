'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FiShoppingCart, FiPackage, FiDownload, FiCheck, FiStar, FiEye, FiShoppingBag, FiPlay } from 'react-icons/fi';
import { Product } from '@/types';
import { useCartStore } from '@/lib/stores/cart-store';
import { useCurrency } from '@/lib/hooks/use-currency';
import styles from './product-card.module.css';

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const addItem = useCartStore((state) => state.addItem);
    const isInCart = useCartStore((state) => state.isInCart);
    const getCartItemQuantity = useCartStore((state) => state.getCartItemQuantity);

    const hasDiscount = product.discountedPrice && product.discountedPrice < product.price;
    const displayPrice = hasDiscount ? product.discountedPrice : product.price;
    const isDigital = product.type === 'digital';
    const inCart = isInCart(product._id);

    // Get real-time cart quantity and stock info
    const cartQuantity = getCartItemQuantity(product._id);
    const totalStock = product.inventory?.stock ?? 0;
    const availableToAdd = isDigital ? (inCart ? 0 : 1) : Math.max(0, totalStock - cartQuantity);
    const isOutOfStock = product.type === 'physical' && totalStock === 0;
    const isStockLimitReached = product.type === 'physical' && cartQuantity >= totalStock && totalStock > 0;

    // Calculate discount percentage
    const discountPercentage = hasDiscount
        ? Math.round(((product.price - product.discountedPrice!) / product.price) * 100)
        : 0;

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

    const { priceInCurrency }: any = useCurrency();
    const formatPrice = (price: number) => priceInCurrency(price);

    // Format large numbers for display
    const formatCount = (count?: number) => {
        if (!count) return '0';
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return count.toString();
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (availableToAdd > 0) addItem(product, 1);
    };

    const productLink = `/market/${product.slug || product._id}`;

    // Determine button state and text - updates in real-time based on cart state
    const getButtonState = () => {
        // Out of stock (no stock at all)
        if (isOutOfStock) {
            return { text: 'Out of Stock', disabled: true, icon: <FiPackage size={14} /> };
        }
        // Digital product already in cart
        if (isDigital && inCart) {
            return { text: 'Added', disabled: true, icon: <FiCheck size={14} /> };
        }
        // Physical product - stock limit reached
        if (isStockLimitReached) {
            return { text: `Max ${totalStock} in Cart`, disabled: true, icon: <FiCheck size={14} /> };
        }
        // Digital - available to add
        if (isDigital) {
            return { text: 'Add to Cart', disabled: false, icon: <FiDownload size={14} /> };
        }
        // Physical - available to add (show remaining if some in cart)
        if (cartQuantity > 0) {
            return { text: `Add More (${availableToAdd} left)`, disabled: false, icon: <FiShoppingCart size={14} /> };
        }
        return { text: 'Add to Cart', disabled: false, icon: <FiShoppingCart size={14} /> };
    };

    const buttonState = getButtonState();

    return (
        <article className={styles.card}>
            <Link href={productLink} className={styles.cardLink}>
                {/* Image Section */}
                <div className={styles.imageWrapper}>
                    {/* Top Left: New Badge */}
                    {isNew && <span className={styles.newBadge}>NEW ARRIVAL</span>}

                    {/* Main Image */}
                    {product.assets && product.assets.length > 0 ? (
                        <Image
                            src={product.assets[0]}
                            alt={product.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className={styles.image}
                        />
                    ) : (
                        <div className={styles.placeholder}><FiPackage /></div>
                    )}

                    {/* Bottom Left: Tag/Type Badge */}
                    <div className={styles.statusBadgeWrapper}>
                        <span className={`${styles.statusBadge} ${isDigital ? styles.digitalBadge : styles.inStockBadge}`}>
                            <span className={styles.statusDot}></span>
                            {isDigital ? 'DIGITAL DOWNLOAD' : (product.category || 'PHYSICAL GOOD')}
                        </span>
                    </div>

                    {/* YouTube Play Overlay */}
                    {product.videoUrl && (
                        <div className={styles.playOverlay}>
                            <FiPlay size={28} />
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className={styles.content}>
                    {/* Brand & Stock Row */}
                    <div className={styles.metaRow}>
                        <span className={styles.brand}>
                            {product.brand || 'ULTRASPACE'}
                        </span>
                        {/* Show Stock for Physical Products */}
                        {!isDigital && totalStock > 0 && (
                            <span className={styles.stockCount}>
                                {totalStock} in stock
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h3 className={styles.title}>{product.title}</h3>

                    {/* Price */}
                    <div className={styles.priceRow}>
                        <span className={styles.price}>{formatPrice(displayPrice!)}</span>
                        {hasDiscount && (
                            <>
                                <span className={styles.originalPrice}>{formatPrice(product.price)}</span>
                                <span className={styles.discountBadge}>-{discountPercentage}%</span>
                            </>
                        )}
                    </div>

                    {/* Rating */}
                    {product.rating !== undefined && product.rating > 0 && (
                        <div className={styles.ratingRow}>
                            <div className={styles.stars}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <FiStar
                                        key={star}
                                        size={12}
                                        className={`${styles.star} ${star <= Math.round(product.rating || 0) ? styles.starFilled : ''}`}
                                    />
                                ))}
                            </div>
                            <span className={styles.ratingCount}>({product.ratingCount})</span>
                        </div>
                    )}

                    {/* Analytics Stats */}
                    <div className={styles.statsRow}>
                        <span className={styles.statItem}>
                            <FiEye className={styles.statIcon} />
                            {formatCount(product.totalViews+1000)}
                        </span>
                        {isDigital ? (
                            <span className={styles.statItem}>
                                <FiDownload className={styles.statIcon} />
                                {formatCount(product.totalDownloads+500)}
                            </span>
                        ) : (
                            <span className={styles.statItem}>
                                <FiShoppingBag className={styles.statIcon} />
                                {formatCount(product.totalSolds+200)}
                            </span>
                        )}
                    </div>

                    {/* Options Preview (Colors & Sizes) */}
                    {(optionsPreview?.colors || optionsPreview?.sizes) && (
                        <div className={styles.optionsContainer}>
                            {optionsPreview.colors && (
                                <div className={styles.optionGroup}>
                                    <span className={styles.optionLabel}>Color:</span>
                                    <div className={styles.colorSwatches}>
                                        {optionsPreview.colors.values.slice(0, 3).map((color, i) => (
                                            <span
                                                key={i}
                                                className={styles.swatch}
                                                style={{ backgroundColor: color.toLowerCase() }}
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {optionsPreview.sizes && (
                                <div className={styles.optionGroup}>
                                    <span className={styles.optionLabel}>Size:</span>
                                    <div className={styles.sizeBadges}>
                                        {optionsPreview.sizes.values.slice(0, 3).map((size, i) => (
                                            <span key={i} className={styles.sizeBadge}>{size}</span>
                                        ))}
                                        {optionsPreview.sizes.values.length > 3 && (
                                            <span className={styles.moreSizes}>+{optionsPreview.sizes.values.length - 3}</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
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
