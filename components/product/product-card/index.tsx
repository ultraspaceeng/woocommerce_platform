'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FiShoppingCart, FiPackage } from 'react-icons/fi';
import { Product } from '@/types';
import { useCartStore } from '@/lib/stores/cart-store';
import styles from './product-card.module.css';

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const addItem = useCartStore((state) => state.addItem);

    const hasDiscount = product.discountedPrice && product.discountedPrice < product.price;
    const displayPrice = hasDiscount ? product.discountedPrice : product.price;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const handleAddToCart = () => {
        addItem(product, 1);
    };

    return (
        <article className={styles.card}>
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

                {product.type === 'digital' && (
                    <span className={`${styles.badge} ${styles.digitalBadge}`}>
                        Digital
                    </span>
                )}

                {hasDiscount && (
                    <span className={`${styles.badge} ${styles.saleBadge}`}>
                        Sale
                    </span>
                )}
            </div>

            <div className={styles.content}>
                {product.category && (
                    <span className={styles.category}>{product.category}</span>
                )}

                <h3 className={styles.title}>
                    <Link href={`/market/${product.slug || product._id}`} className={styles.titleLink}>
                        {product.title}
                    </Link>
                </h3>

                <div className={styles.priceRow}>
                    <span className={styles.price}>{formatPrice(displayPrice!)}</span>
                    {hasDiscount && (
                        <span className={styles.originalPrice}>
                            {formatPrice(product.price)}
                        </span>
                    )}
                </div>

                <button
                    className={styles.addToCart}
                    onClick={handleAddToCart}
                    disabled={product.type === 'physical' && product.inventory?.stock === 0}
                >
                    <FiShoppingCart size={16} />
                    {product.type === 'physical' && product.inventory?.stock === 0
                        ? 'Out of Stock'
                        : 'Add to Cart'}
                </button>
            </div>
        </article>
    );
}
