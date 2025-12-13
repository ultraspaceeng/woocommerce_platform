'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiMinus, FiPlus, FiShoppingCart, FiPackage, FiCheck, FiX } from 'react-icons/fi';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import Button from '@/components/ui/button';
import { Product } from '@/types';
import { productsApi } from '@/lib/services/api';
import { useCartStore } from '@/lib/stores/cart-store';
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
            } catch {
                setError('Product not found');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const handleAddToCart = () => {
        if (product) {
            addItem(product, quantity, selectedOptions);
            openCart();
        }
    };

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(price);

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
                    <nav className={styles.breadcrumb}>
                        <Link href="/">Home</Link> / <Link href="/market">Market</Link> / {product.title}
                    </nav>

                    <div className={styles.productLayout}>
                        <div className={styles.mainImage}>
                            {product.assets?.[0] ? (
                                <Image src={product.assets[0]} alt={product.title} fill className={styles.image} priority />
                            ) : (
                                <div className={styles.imagePlaceholder}><FiPackage /></div>
                            )}
                        </div>

                        <div className={styles.productInfo}>
                            {product.type === 'digital' && <span className={styles.badge}>Digital</span>}
                            {product.category && <span className={styles.category}>{product.category}</span>}
                            <h1 className={styles.title}>{product.title}</h1>

                            <div className={styles.priceBlock}>
                                <span className={styles.price}>{formatPrice(displayPrice!)}</span>
                                <span className={styles.originalPrice}>{hasDiscount && formatPrice(product.price)}</span>
                            </div>

                            <p className={styles.description}>{product.description}</p>

                            {product.options?.map((option) => (
                                <div key={option.name} className={styles.optionGroup}>
                                    <span className={styles.optionLabel}>{option.name}</span>
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

                            <Button
                                size="lg"
                                fullWidth
                                onClick={handleAddToCart}
                                disabled={buttonState.disabled}
                                leftIcon={buttonState.icon}
                            >
                                {buttonState.text}
                            </Button>

                            <div className={`${styles.stockInfo} ${isInStock ? styles.inStock : styles.outOfStock}`}>
                                {isInStock ? <><FiCheck /> In Stock</> : <><FiX /> Out of Stock</>}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
