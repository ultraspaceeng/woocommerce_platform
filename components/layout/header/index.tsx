'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FiShoppingCart, FiMenu, FiX, FiSearch } from 'react-icons/fi';
import { useCartStore } from '@/lib/stores/cart-store';
import styles from './header.module.css';

const navLinks = [
    { href: '/market', label: 'Shop' },
    { href: '/order-tracking', label: 'Track Order' },
];

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    // Prevent hydration mismatch by only showing cart count after mount
    const [hasMounted, setHasMounted] = useState(false);
    const itemCount = useCartStore((state) => state.getItemCount());
    const toggleCart = useCartStore((state) => state.toggleCart);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
    const closeMobileMenu = () => setMobileMenuOpen(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/market?search=${encodeURIComponent(searchQuery)}`);
            closeMobileMenu();
        }
    };

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>
                    <span className={styles.logoIcon}>U</span>
                    UltraSpace
                </Link>

                <nav className={styles.nav}>
                    {navLinks.map((link, index) => (
                        <Link
                            key={`${link.href}-${index}`}
                            href={link.href}
                            className={`${styles.navLink} ${hasMounted && pathname === link.href ? styles.active : ''}`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className={styles.searchContainer}>
                    <form className={styles.searchForm} onSubmit={handleSearch}>
                        <FiSearch className={styles.searchIcon} size={20} />
                        <input
                            type="text"
                            placeholder="What are you looking for?"
                            className={styles.searchInput}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </form>
                </div>

                <div className={styles.actions}>
                    <button
                        className={styles.iconButton}
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
                    <div className={styles.mobileSearch}>
                        <form className={styles.searchForm} onSubmit={handleSearch}>
                            <FiSearch className={styles.searchIcon} size={20} />
                            <input
                                type="text"
                                placeholder="Search products..."
                                className={styles.searchInput}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </form>
                    </div>
                    {navLinks.map((link, index) => (
                        <Link
                            key={`mobile-${link.href}-${index}`}
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
