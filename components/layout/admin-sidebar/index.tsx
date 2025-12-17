'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    FiGrid, FiPackage, FiShoppingCart, FiUsers, FiSettings,
    FiLogOut, FiTrendingUp, FiTag, FiArchive
} from 'react-icons/fi';
import { useAdminStore } from '@/lib/stores/admin-store';
import styles from './admin-sidebar.module.css';

const mainNavItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: FiGrid },
    { href: '/admin/analytics', label: 'Analytics', icon: FiTrendingUp },
    { href: '/admin/analytics/products', label: 'Product Analytics', icon: FiPackage },
];

const commerceNavItems = [
    { href: '/admin/products', label: 'Products', icon: FiPackage },
    { href: '/admin/orders', label: 'Orders', icon: FiShoppingCart, badge: 'New' },
    { href: '/admin/categories', label: 'Categories', icon: FiTag },
    { href: '/admin/inventory', label: 'Inventory', icon: FiArchive },
];

const managementNavItems = [
    { href: '/admin/users', label: 'Customers', icon: FiUsers },
    { href: '/admin/settings', label: 'Settings', icon: FiSettings },
];

interface AdminSidebarProps {
    isOpen?: boolean;
}

export default function AdminSidebar({ isOpen }: AdminSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { email, logout } = useAdminStore();

    const handleLogout = () => {
        logout();
        router.push('/admin');
    };

    const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

    const NavLink = ({ item }: { item: typeof mainNavItems[0] & { badge?: string } }) => {
        const Icon = item.icon;
        return (
            <Link
                href={item.href}
                className={`${styles.navLink} ${isActive(item.href) ? styles.active : ''}`}
            >
                <span className={styles.navLinkIcon}><Icon size={18} /></span>
                {item.label}
                {item.badge && <span className={styles.navLinkBadge}>{item.badge}</span>}
            </Link>
        );
    };

    return (
        <aside className={`${styles.adminSidebar} ${isOpen ? styles.open : ''}`}>
            <div className={styles.sidebarHeader}>
                <div className={styles.sidebarLogo}>
                    <span className={styles.logoIcon}>R</span>
                    <div>
                        <div className={styles.logoText}>Royal Commerce</div>
                        <div className={styles.logoSubtext}>Admin Panel</div>
                    </div>
                </div>
            </div>

            <nav className={styles.sidebarNav}>
                <div className={styles.navSection}>
                    <div className={styles.navSectionTitle}>Overview</div>
                    {mainNavItems.map((item) => <NavLink key={item.href} item={item} />)}
                </div>

                <div className={styles.navSection}>
                    <div className={styles.navSectionTitle}>Commerce</div>
                    {commerceNavItems.map((item) => <NavLink key={item.href} item={item} />)}
                </div>

                <div className={styles.navSection}>
                    <div className={styles.navSectionTitle}>Management</div>
                    {managementNavItems.map((item) => <NavLink key={item.href} item={item} />)}
                </div>
            </nav>

            <div className={styles.sidebarFooter}>
                <div className={styles.userCard}>
                    <div className={styles.userAvatar}>
                        {email?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div className={styles.userInfo}>
                        <div className={styles.userName}>Administrator</div>
                        <div className={styles.userRole}>{email || 'admin@royal.com'}</div>
                    </div>
                    <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
                        <FiLogOut size={18} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
