'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiShoppingCart, FiMenu, FiX } from 'react-icons/fi';
import ThemeToggle from '@/components/ui/theme-toggle';
import { useCartStore } from '@/lib/stores/cart-store';
import styles from './header.module.css';

const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/market', label: 'Market' },
    { href: '/order-tracking', label: 'Track Order' },
];

export default function Header() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    // Prevent hydration mismatch by only showing cart count after mount
    const [hasMounted, setHasMounted] = useState(false);
    const itemCount = useCartStore((state) => state.getItemCount());
    const toggleCart = useCartStore((state) => state.toggleCart);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
    const closeMobileMenu = () => setMobileMenuOpen(false);

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>
                    <span className={styles.logoIcon}>U</span>
                    UltraSpaceStore
                </Link>

                <nav className={styles.nav}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`${styles.navLink} ${hasMounted && pathname === link.href ? styles.active : ''}`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className={styles.actions}>
                    {/* <ThemeToggle /> */}

                    <button
                        className={styles.cartButton}
                        onClick={toggleCart}
                        aria-label="Open cart"
                    >
                        <FiShoppingCart size={22} />
                        {hasMounted && itemCount > 0 && (
                            <span className={styles.cartBadge}>
                                {itemCount > 99 ? '99+' : itemCount}
                            </span>
                        )}
                    </button>

                    <button
                        className={styles.mobileMenuButton}
                        onClick={toggleMobileMenu}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                    </button>
                </div>
            </div>

            {mobileMenuOpen && (
                <nav className={styles.mobileMenu}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={styles.mobileNavLink}
                            onClick={closeMobileMenu}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
            )}
        </header>
    );
}
