'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiArrowRight, FiCheck, FiMail, FiMapPin, FiPhone, FiPackage, FiShoppingBag, FiBox, FiStar, FiTrendingUp, FiShoppingCart, FiDollarSign, FiTruck, FiShield, FiHeadphones, FiZap } from 'react-icons/fi';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import Button from '@/components/ui/button';
import ProductCard from '@/components/product/product-card';
import PushNotificationPrompt from '@/components/ui/push-notification-prompt';
import { Product } from '@/types';
import { productsApi } from '@/lib/services/api';
import styles from './page.module.css';
import PageTracker from '@/components/analytics/page-tracker';

export default function HomePage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response: any = await productsApi.getAll({ limit: 4 });
                setProducts(response.data.data.products);
            } catch (error) {
                console.error('Failed to fetch products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    return (
        <div className={styles.page}>
            <PageTracker />
            <Header />

            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroContainer}>
                    <div className={styles.heroContent}>
                        <div className={styles.heroBadge}>
                            <span className={styles.heroBadgeDot}></span>
                            <span>Premium E-Commerce Platform</span>
                        </div>
                        <h1 className={styles.heroTitle}>
                            Shop <span className={styles.heroHighlight}>Premium</span> Products Without Limits
                        </h1>
                        <p className={styles.heroDescription}>
                            Discover our curated collection of premium physical and digital products.
                            Experience seamless shopping with quality you can trust.
                        </p>
                        <div className={styles.heroActions}>
                            <Link href="/market">
                                <Button size="lg" rightIcon={<FiArrowRight />}>
                                    Shop Now
                                </Button>
                            </Link>
                            <Link href="#features">
                                <Button variant="secondary" size="lg">
                                    Learn More
                                </Button>
                            </Link>
                        </div>
                        <div className={styles.heroTrust}>
                            <div className={styles.heroAvatars}>
                                <div className={styles.heroAvatar}>JD</div>
                                <div className={styles.heroAvatar}>MK</div>
                                <div className={styles.heroAvatar}>AS</div>
                            </div>
                            <span className={styles.heroTrustText}>Trusted by 10,000+ customers</span>
                        </div>
                    </div>

                    {/* Animated E-commerce Illustration */}
                    <div className={styles.heroImage}>
                        <div className={styles.heroAnimationWrapper}>
                            <div className={styles.heroGlow}></div>

                            {/* Floating Elements */}
                            <div className={styles.heroFloatingElements}>
                                <div className={styles.heroFloatingBox}>
                                    <FiBox size={24} color="white" />
                                </div>
                                <div className={styles.heroFloatingBag}>
                                    <FiShoppingBag size={24} color="white" />
                                </div>
                                <div className={styles.heroFloatingStar}>
                                    <FiStar size={20} color="white" />
                                </div>
                            </div>

                            {/* Browser Mockup */}
                            <div className={styles.heroBrowser}>
                                <div className={styles.heroBrowserBar}>
                                    <div className={styles.heroBrowserDot}></div>
                                    <div className={styles.heroBrowserDot}></div>
                                    <div className={styles.heroBrowserDot}></div>
                                </div>
                                <div className={styles.heroBrowserContent}>
                                    {/* Shopping Items */}
                                    <div className={styles.heroShoppingItems}>
                                        <div className={styles.heroShopItem}>
                                            <div className={styles.heroShopIcon}>
                                                <FiPackage size={20} />
                                            </div>
                                            <span className={styles.heroShopPrice}>$49</span>
                                        </div>
                                        <div className={styles.heroShopItem}>
                                            <div className={styles.heroShopIcon}>
                                                <FiBox size={20} />
                                            </div>
                                            <span className={styles.heroShopPrice}>$89</span>
                                        </div>
                                        <div className={styles.heroShopItem}>
                                            <div className={styles.heroShopIcon}>
                                                <FiZap size={20} />
                                            </div>
                                            <span className={styles.heroShopPrice}>$29</span>
                                        </div>
                                    </div>

                                    {/* Cart Bar */}
                                    <div className={styles.heroCartBar}>
                                        <div className={styles.heroCartInfo}>
                                            <div className={styles.heroCartIcon}>
                                                <FiShoppingCart size={20} />
                                                <span className={styles.heroCartBadge}>3</span>
                                            </div>
                                            <span className={styles.heroCartText}>Your Cart</span>
                                        </div>
                                        <span className={styles.heroCartTotal}>$167</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust Strip */}
            <section className={styles.trustStrip}>
                <div className={styles.trustStripContainer}>
                    <p className={styles.trustStripTitle}>Powering the next generation of shoppers</p>
                    <div className={styles.trustStripLogos}>
                        <span className={styles.trustLogo}><FiBox /> ACME Corp</span>
                        <span className={styles.trustLogo}><FiZap /> EnergyInc</span>
                        <span className={styles.trustLogo}><FiTruck /> FlowState</span>
                        <span className={styles.trustLogo}><FiStar /> StarTech</span>
                        <span className={styles.trustLogo}><FiShield /> SecureBox</span>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className={styles.featuresSection}>
                <div className={styles.featuresContainer}>
                    <div className={styles.featuresHeader}>
                        <h2 className={styles.featuresTitle}>Everything you need to shop smart</h2>
                        <p className={styles.featuresSubtitle}>
                            Designed for modern shoppers who demand quality, speed, and exceptional service.
                        </p>
                    </div>
                    <div className={styles.featuresGrid}>
                        <div className={styles.featureCard}>
                            <div className={styles.featureIconWrapper}>
                                <FiDollarSign size={24} />
                            </div>
                            <h3 className={styles.featureTitle}>Best Prices</h3>
                            <p className={styles.featureDescription}>
                                Competitive pricing with regular discounts and exclusive deals for our members.
                            </p>
                        </div>
                        <div className={styles.featureCard}>
                            <div className={styles.featureIconWrapper}>
                                <FiTruck size={24} />
                            </div>
                            <h3 className={styles.featureTitle}>Fast Delivery</h3>
                            <p className={styles.featureDescription}>
                                Swift shipping with real-time tracking. Get your orders when you need them.
                            </p>
                        </div>
                        <div className={styles.featureCard}>
                            <div className={styles.featureIconWrapper}>
                                <FiShield size={24} />
                            </div>
                            <h3 className={styles.featureTitle}>Secure Payments</h3>
                            <p className={styles.featureDescription}>
                                Your transactions are protected with industry-leading encryption technology.
                            </p>
                        </div>
                        <div className={styles.featureCard}>
                            <div className={styles.featureIconWrapper}>
                                <FiHeadphones size={24} />
                            </div>
                            <h3 className={styles.featureTitle}>24/7 Support</h3>
                            <p className={styles.featureDescription}>
                                Our dedicated team is always ready to help you with any questions.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Highlight / About */}
            <section className={styles.highlightSection}>
                <div className={styles.highlightContainer}>
                    <div className={styles.highlightGrid}>
                        <div className={styles.highlightContent}>
                            <h2 className={styles.highlightTitle}>Simplify your shopping experience</h2>
                            <p className={styles.highlightText}>
                                We bridge the gap between premium products and everyday shoppers.
                                Empowering over 10,000 customers globally to discover quality products
                                with seamless checkout and reliable delivery.
                            </p>
                            <div className={styles.highlightChecks}>
                                <div className={styles.highlightCheck}>
                                    <FiCheck className={styles.highlightCheckIcon} />
                                    <span>Premium quality guaranteed</span>
                                </div>
                                <div className={styles.highlightCheck}>
                                    <FiCheck className={styles.highlightCheckIcon} />
                                    <span>Worldwide shipping available</span>
                                </div>
                                <div className={styles.highlightCheck}>
                                    <FiCheck className={styles.highlightCheckIcon} />
                                    <span>Easy returns and refunds</span>
                                </div>
                            </div>
                            <div className={styles.highlightActions}>
                                <Link href="/market">
                                    <Button variant="secondary">Browse Products</Button>
                                </Link>
                                <Link href="#contact" className={styles.highlightLink}>
                                    Contact Us →
                                </Link>
                            </div>
                        </div>
                        <div className={styles.highlightImageWrapper}>
                            <div className={styles.highlightImagePlaceholder}>
                                <FiPackage />
                            </div>
                            <div className={styles.highlightStatsCard}>
                                <div className={styles.highlightStatsHeader}>
                                    <span className={styles.highlightStatsLabel}>Customer Satisfaction</span>
                                    <FiTrendingUp className={styles.highlightStatsIcon} />
                                </div>
                                <div className={styles.highlightStatsValue}>
                                    <span className={styles.highlightStatsBig}>+98%</span>
                                    <span className={styles.highlightStatsSmall}>Positive Reviews</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Popular Products Section */}
            <section className={`${styles.section} ${styles.sectionAlt}`}>
                <div className={styles.sectionContainer}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionTag}>Featured</span>
                        <h2 className={styles.sectionTitle}>Popular Products</h2>
                        <p className={styles.sectionDescription}>
                            Explore our most loved items, handpicked for quality and value.
                        </p>
                    </div>

                    {loading ? (
                        <div className={styles.emptyState}>
                            <p>Loading products...</p>
                        </div>
                    ) : products.length > 0 ? (
                        <>
                            <div className={styles.productsGrid}>
                                {products.map((product) => (
                                    <ProductCard key={product._id} product={product} />
                                ))}
                            </div>
                            <div className={styles.viewAllWrapper}>
                                <Link href="/market">
                                    <Button variant="secondary" rightIcon={<FiArrowRight />}>
                                        View All Products
                                    </Button>
                                </Link>
                            </div>
                        </>
                    ) : (
                        <div className={styles.emptyState}>
                            <FiPackage className={styles.emptyIcon} />
                            <p>No products available yet. Check back soon!</p>
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section className={styles.ctaSection}>
                <div className={styles.ctaPattern}></div>
                <div className={styles.ctaContainer}>
                    <h2 className={styles.ctaTitle}>Ready to start shopping?</h2>
                    <p className={styles.ctaText}>
                        Join thousands of satisfied customers and discover premium products at unbeatable prices.
                    </p>
                    <div className={styles.ctaActions}>
                        <Link href="/market">
                            <button className={styles.ctaBtnPrimary}>
                                Browse Products
                            </button>
                        </Link>
                        <Link href="#contact">
                            <button className={styles.ctaBtnSecondary}>
                                Contact Us
                            </button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className={`${styles.section} ${styles.sectionAlt}`}>
                <div className={styles.sectionContainer}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionTag}>Contact</span>
                        <h2 className={styles.sectionTitle}>Get In Touch</h2>
                        <p className={styles.sectionDescription}>
                            Have questions? We&apos;d love to hear from you. Send us a message!
                        </p>
                    </div>

                    <div className={styles.contactContent}>
                        <div className={styles.contactInfo}>
                            <h3>Contact Information</h3>
                            <p>
                                Fill out the form and our team will get back to you within 24 hours.
                            </p>
                            <div className={styles.contactDetails}>
                                <div className={styles.contactItem}>
                                    <span className={styles.contactIcon}>
                                        <FiMail size={18} />
                                    </span>
                                    <span>ultraspaceeng@gmail.com</span>
                                </div>
                                <div className={styles.contactItem}>
                                    <span className={styles.contactIcon}>
                                        <FiPhone size={18} />
                                    </span>
                                    <span>+234 08131519518</span>
                                </div>
                                <div className={styles.contactItem}>
                                    <span className={styles.contactIcon}>
                                        <FiMapPin size={18} />
                                    </span>
                                    <span>International!</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />

            {/* Push Notification Prompt for Visitors */}
            <PushNotificationPrompt type="visitor" />
        </div>
    );
}
