'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiArrowRight, FiCheck, FiMail, FiMapPin, FiPhone, FiPackage } from 'react-icons/fi';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import Button from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import ProductCard from '@/components/product/product-card';
import { Product } from '@/types';
import { productsApi } from '@/lib/services/api';
import styles from './page.module.css';

export default function HomePage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response:any = await productsApi.getAll({ limit: 4 });
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
            <Header />

            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroContainer}>
                    <div className={styles.heroContent}>
                        <span className={styles.heroTag}>Premium E-Commerce</span>
                        <h1 className={styles.heroTitle}>
                            Shop Like <span className={styles.heroHighlight}>Royalty</span>
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
                            <Link href="#about">
                                <Button variant="secondary" size="lg">
                                    Learn More
                                </Button>
                            </Link>
                        </div>
                    </div>
                    <div className={styles.heroImage}>
                        <div className={styles.heroImageInner}>
                            <FiPackage className={styles.heroPlaceholder} />
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

            {/* About Section */}
            <section id="about" className={styles.section}>
                <div className={styles.sectionContainer}>
                    <div className={styles.aboutContent}>
                        <div className={styles.aboutImage}>
                            <FiPackage className={styles.aboutPlaceholder} />
                        </div>
                        <div className={styles.aboutText}>
                            <span className={styles.sectionTag}>About Us</span>
                            <h3>Your Trusted Shopping Destination</h3>
                            <p>
                                Royal Commerce is dedicated to providing you with the finest selection
                                of physical and digital products. We believe in quality, transparency,
                                and exceptional customer service.
                            </p>
                            <p>
                                Whether you&apos;re looking for tangible goods delivered to your doorstep
                                or instant digital downloads, we&apos;ve got you covered with secure
                                transactions and reliable fulfillment.
                            </p>
                            <div className={styles.features}>
                                <div className={styles.feature}>
                                    <FiCheck className={styles.featureIcon} />
                                    <span>Premium Quality</span>
                                </div>
                                <div className={styles.feature}>
                                    <FiCheck className={styles.featureIcon} />
                                    <span>Secure Payments</span>
                                </div>
                                <div className={styles.feature}>
                                    <FiCheck className={styles.featureIcon} />
                                    <span>Fast Delivery</span>
                                </div>
                                <div className={styles.feature}>
                                    <FiCheck className={styles.featureIcon} />
                                    <span>24/7 Support</span>
                                </div>
                            </div>
                        </div>
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
                                    <span>support@royalcommerce.com</span>
                                </div>
                                <div className={styles.contactItem}>
                                    <span className={styles.contactIcon}>
                                        <FiPhone size={18} />
                                    </span>
                                    <span>+234 800 000 0000</span>
                                </div>
                                <div className={styles.contactItem}>
                                    <span className={styles.contactIcon}>
                                        <FiMapPin size={18} />
                                    </span>
                                    <span>Lagos, Nigeria</span>
                                </div>
                            </div>
                        </div>

                        {/* <form className={styles.contactForm} onSubmit={(e) => e.preventDefault()}>
                            <div className={styles.formGrid}>
                                <Input
                                    label="Full Name"
                                    placeholder="John Doe"
                                    required
                                />
                                <Input
                                    label="Email"
                                    type="email"
                                    placeholder="john@example.com"
                                    required
                                />
                                <Textarea
                                    label="Message"
                                    placeholder="How can we help you?"
                                    rows={4}
                                    required
                                />
                            </div>
                            <div className={styles.formSubmit}>
                                <Button type="submit" fullWidth>
                                    Send Message
                                </Button>
                            </div>
                        </form> */}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
