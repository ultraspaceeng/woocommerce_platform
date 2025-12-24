'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiMinus, FiPlus, FiShoppingCart, FiPackage, FiCheck, FiX, FiStar, FiEye, FiDownload, FiShoppingBag, FiChevronRight, FiChevronLeft, FiHeart, FiTruck, FiShield, FiRotateCcw, FiPlay, FiExternalLink } from 'react-icons/fi';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import Button from '@/components/ui/button';
import ProductReviews from '@/components/product/product-reviews';
import { Product } from '@/types';
import { productsApi } from '@/lib/services/api';
import { useCartStore } from '@/lib/stores/cart-store';
import { useCurrency } from '@/lib/hooks/use-currency';
import styles from './page.module.css';

interface ProductPageProps {
    params: Promise<{ id: string }>;
}

export default function ProductPage({ params }: ProductPageProps) {
    const { id } = use(params);
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    const addItem = useCartStore((state) => state.addItem);
    const openCart = useCartStore((state) => state.openCart);
    const checkIfInCart = useCartStore((state) => state.isInCart);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await productsApi.getById(id);
                setProduct(response.data.data);
                if (response.data.data.options) {
                    const defaults: Record<string, string> = {};
                    response.data.data.options.forEach((opt: { name: string; values: string[] }) => {
                        if (opt.values.length > 0) defaults[opt.name] = opt.values[0];
                    });
                    setSelectedOptions(defaults);
                }

                const viewedKey = `product_viewed_${id}`;
                const viewedData = localStorage.getItem(viewedKey);
                if (viewedData != "true") {
                    localStorage.setItem(viewedKey, "true");
                    fetch(`/api/products/${id}/view`, { method: 'POST' }).catch(() => { });
                }
            } catch {
                setError('Product not found');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const formatCount = (count?: number) => {
        if (!count) return '0';
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return count.toString();
    };

    const handleAddToCart = () => {
        if (product) {
            addItem(product, quantity, selectedOptions);
            openCart();
        }
    };

    const handleNextImage = () => {
        const totalAssets = (product?.assets?.length || 0) + (product?.videoUrl ? 1 : 0);
        setSelectedImageIndex((prev) => (prev === totalAssets - 1 ? 0 : prev + 1));
    };

    const handlePrevImage = () => {
        const totalAssets = (product?.assets?.length || 0) + (product?.videoUrl ? 1 : 0);
        setSelectedImageIndex((prev) => (prev === 0 ? totalAssets - 1 : prev - 1));
    };

    const { priceInCurrency }: any = useCurrency();
    const formatPrice = (price: number) => priceInCurrency(price);

    if (loading) {
        return (
            <div className={styles.page}>
                <Header />
                <main className={styles.main}><div className={styles.container}><div className={styles.loading}><p>Loading...</p></div></div></main>
                <Footer />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className={styles.page}>
                <Header />
                <main className={styles.main}>
                    <div className={styles.container}>
                        <div className={styles.error}>
                            <h2 className={styles.errorTitle}>Product Not Found</h2>
                            <Link href="/market"><Button>Back to Market</Button></Link>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const hasDiscount = product.discountedPrice && product.discountedPrice < product.price;
    const displayPrice = hasDiscount ? product.discountedPrice : product.price;
    const isInStock = product?.type === 'digital' || (product?.inventory?.stock || 0) > 0;
    const inCart = product ? checkIfInCart(product._id) : false;
    const isDigital = product?.type === 'digital';
    const discountPercent = hasDiscount ? Math.round((1 - product.discountedPrice! / product.price) * 100) : 0;

    const getButtonState = () => {
        if (isDigital && inCart) {
            return { text: 'Added to Cart', disabled: true, icon: <FiCheck /> };
        }
        if (!isInStock) {
            return { text: 'Out of Stock', disabled: true, icon: <FiX /> };
        }
        return { text: 'Add to Cart', disabled: false, icon: <FiShoppingCart /> };
    };

    const buttonState = getButtonState();

    return (
        <div className={styles.page}>
            <Header />
            <main className={styles.main}>
                <div className={styles.container}>
                    {/* Breadcrumb */}
                    <nav className={styles.breadcrumb}>
                        <Link href="/">Home</Link>
                        <FiChevronRight size={14} />
                        <Link href="/market">Products</Link>
                        <FiChevronRight size={14} />
                        <span>{product.title}</span>
                    </nav>

                    <div className={styles.productLayout}>
                        {/* Image Gallery */}
                        <div className={styles.imageSection}>
                            <div className={styles.mainImage}>
                                {product.videoUrl && selectedImageIndex === (product.assets?.length || 0) ? (() => {
                                    // Extract YouTube video ID from various URL formats
                                    const getYouTubeEmbedUrl = (url: string) => {
                                        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                                        const match = url.match(regExp);
                                        const videoId = (match && match[2].length === 11) ? match[2] : null;
                                        return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
                                    };
                                    const embedUrl = getYouTubeEmbedUrl(product.videoUrl);
                                    return embedUrl ? (
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            src={embedUrl}
                                            title="Product Video"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className={styles.videoFrame}
                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                        ></iframe>
                                    ) : (
                                        <div className={styles.imagePlaceholder}>Invalid video URL</div>
                                    );
                                })() : product.assets && product.assets.length > 0 ? (
                                    <>
                                        <Image
                                            src={product.assets[selectedImageIndex] || product.assets[0]}
                                            alt={product.title}
                                            priority
                                            fill
                                            className={styles.image}
                                        />
                                        {/* Play button overlay if needed? No, logic moved to video selection */}
                                        {product.assets.length + (product.videoUrl ? 1 : 0) > 1 && (
                                            <>
                                                <button className={`${styles.imageNav} ${styles.imageNavPrev}`} onClick={handlePrevImage}>
                                                    <FiChevronLeft size={20} />
                                                </button>
                                                <button className={`${styles.imageNav} ${styles.imageNavNext}`} onClick={handleNextImage}>
                                                    <FiChevronRight size={20} />
                                                </button>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div className={styles.imagePlaceholder}><FiPackage /></div>
                                )}
                            </div>



                            {/* Thumbnails (Images + Video) */}
                            {(product.assets && (product.assets.length > 1 || product.videoUrl)) && (
                                <div className={styles.thumbnailRow}>
                                    {product.assets?.map((asset, index) => (
                                        <button
                                            key={index}
                                            className={`${styles.thumbnail} ${selectedImageIndex === index ? styles.activeThumbnail : ''}`}
                                            onClick={() => setSelectedImageIndex(index)}
                                        >
                                            <Image
                                                src={asset}
                                                alt={`${product.title} - Image ${index + 1}`}
                                                fill
                                                className={styles.thumbnailImage}
                                            />
                                        </button>
                                    ))}

                                    {/* Video Thumbnail */}
                                    {product.videoUrl && (
                                        <button
                                            className={`${styles.thumbnail} ${selectedImageIndex === (product.assets?.length || 0) ? styles.activeThumbnail : ''}`}
                                            onClick={() => setSelectedImageIndex(product.assets?.length || 0)}
                                        >
                                            <div className={styles.videoThumbnailPlaceholder}>
                                                <FiPlay size={20} />
                                            </div>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Product Info */}
                        <div className={styles.productInfo}>
                            <div className={styles.productHeader}>
                                <div className={styles.badgeRow}>
                                    {isDigital && <span className={`${styles.badge} ${styles.badgeDigital}`}>Digital Product</span>}
                                    {hasDiscount && <span className={styles.badge}>Save {discountPercent}%</span>}
                                </div>
                                {product.category && <span className={styles.category}>{product.category}</span>}
                                <h1 className={styles.title}>{product.title}</h1>
                            </div>

                            {/* Rating */}
                            {(product.rating !== undefined && product.rating > 0) && (
                                <div className={styles.ratingRow}>
                                    <div className={styles.stars}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <FiStar
                                                key={star}
                                                className={`${styles.star} ${star <= Math.round(product.rating || 0) ? styles.starFilled : ''}`}
                                            />
                                        ))}
                                    </div>
                                    <span className={styles.ratingText}>
                                        {product.rating?.toFixed(1)} ({product.ratingCount} reviews)
                                    </span>
                                    <a href="#reviews" className={styles.ratingLink}>See all reviews</a>
                                </div>
                            )}

                            {/* Analytics Stats */}
                            <div className={styles.statsRow}>
                                <span className={styles.statItem}>
                                    <FiEye className={styles.statIcon} />
                                    {formatCount(product.totalViews)} views
                                </span>
                                {isDigital ? (
                                    <span className={styles.statItem}>
                                        <FiDownload className={styles.statIcon} />
                                        {formatCount(product.totalDownloads)} downloads
                                    </span>
                                ) : (
                                    <span className={styles.statItem}>
                                        <FiShoppingBag className={styles.statIcon} />
                                        {formatCount(product.totalSolds)} sold
                                    </span>
                                )}
                            </div>

                            {/* Price Card */}
                            <div className={styles.priceCard}>
                                <div className={styles.priceBlock}>
                                    <span className={styles.price}>{formatPrice(displayPrice!)}</span>
                                    {hasDiscount && <span className={styles.originalPrice}>{formatPrice(product.price)}</span>}
                                    {hasDiscount && <span className={styles.saveBadge}>SAVE {discountPercent}%</span>}
                                </div>
                                <p className={styles.priceNote}>Inclusive of all taxes</p>

                                <div className={`${styles.stockInfo} ${isInStock ? styles.inStock : styles.outOfStock}`}>
                                    <span className={styles.stockDot}></span>
                                    {isInStock ? 'In Stock' : 'Out of Stock'}
                                </div>
                            </div>

                            {/* Description */}
                            <p className={styles.description}>{product.description}</p>

                            {/* Options */}
                            {product.options && product.options.length > 0 && (
                                <div className={styles.optionsSection}>
                                    {product.options?.map((option) => (
                                        <div key={option.name} className={styles.optionGroup}>
                                            <div className={styles.optionLabel}>
                                                <span>{option.name}</span>
                                                <span className={styles.optionSelected}>{selectedOptions[option.name]}</span>
                                            </div>
                                            <div className={styles.optionValues}>
                                                {option.values.map((value) => (
                                                    <button
                                                        key={value}
                                                        className={`${styles.optionButton} ${selectedOptions[option.name] === value ? styles.selected : ''}`}
                                                        onClick={() => setSelectedOptions({ ...selectedOptions, [option.name]: value })}
                                                    >
                                                        {value}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Quantity (Physical only) */}
                            {product.type === 'physical' && (
                                <div className={styles.quantityWrapper}>
                                    <span className={styles.optionLabel}>Quantity</span>
                                    <div className={styles.quantityControls}>
                                        <button className={styles.quantityButton} onClick={() => setQuantity(Math.max(1, quantity - 1))}><FiMinus /></button>
                                        <span className={styles.quantityValue}>{quantity}</span>
                                        <button className={styles.quantityButton} onClick={() => setQuantity(quantity + 1)}><FiPlus /></button>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className={styles.actionsRow}>
                                <button
                                    className={styles.addToCartBtn}
                                    onClick={handleAddToCart}
                                    disabled={buttonState.disabled}
                                >
                                    {buttonState.icon}
                                    {buttonState.text}
                                </button>
                                <button className={styles.wishlistBtn}>
                                    <FiHeart size={20} />
                                </button>
                            </div>

                            {/* Demo Link / Live Preview */}
                            {isDigital && product.demoLink && (
                                <a
                                    href={product.demoLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.demoLinkBtn}
                                >
                                    <FiExternalLink size={18} />
                                    Live Preview
                                </a>
                            )}

                            {/* Trust Row */}
                            <div className={styles.trustRow}>
                                <span className={styles.trustItem}>
                                    <FiTruck className={styles.trustIcon} /> Free Shipping
                                </span>
                                <span className={styles.trustItem}>
                                    <FiShield className={styles.trustIcon} /> Secure Payment
                                </span>
                                <span className={styles.trustItem}>
                                    <FiRotateCcw className={styles.trustIcon} /> Easy Returns
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Customer Reviews Section */}
                    <div id="reviews">
                        <ProductReviews
                            productId={product._id}
                            productRating={product.rating}
                            ratingCount={product.ratingCount}
                        />
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
