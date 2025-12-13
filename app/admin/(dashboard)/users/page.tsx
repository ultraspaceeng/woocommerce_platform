'use client';

import { useEffect, useState } from 'react';
import { FiSearch, FiDownload, FiUser, FiMail, FiCalendar, FiShoppingBag } from 'react-icons/fi';
import { usersApi } from '@/lib/services/api';
import styles from './page.module.css';

interface User {
    _id: string;
    name: string;
    email: string;
    createdAt: string;
    orderCount?: number;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await usersApi.getAll();
                setUsers(response.data.data || []);
            } catch (error) {
                console.error('Failed to fetch users:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' });

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={styles.page}>
            {/* Page Header */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Customers</h1>
                    <p className={styles.pageSubtitle}>View and manage your customer base</p>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.secondaryBtn}>
                        <FiDownload size={16} />
                        Export
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}><FiUser size={20} /></div>
                    <div className={styles.statValue}>{users.length}</div>
                    <div className={styles.statLabel}>Total Customers</div>
                </div>
            </div>

            {/* Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.searchWrapper}>
                    <FiSearch size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search customers..."
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className={styles.tableCard}>
                {loading ? (
                    <div className={styles.loading}>Loading customers...</div>
                ) : filteredUsers.length === 0 ? (
                    <div className={styles.empty}>
                        <FiUser size={48} />
                        <h3>No customers yet</h3>
                        <p>Customers will appear here after they place orders</p>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Email</th>
                                <th>Orders</th>
                                <th>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user._id}>
                                    <td>
                                        <div className={styles.customerCell}>
                                            <div className={styles.avatar}>
                                                {user.name?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                            <span className={styles.customerName}>{user.name || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.emailCell}>
                                            <FiMail size={14} />
                                            <span>{user.email}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.ordersCell}>
                                            <FiShoppingBag size={14} />
                                            <span>{user.orderCount || 0}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.dateCell}>
                                            <FiCalendar size={14} />
                                            <span>{formatDate(user.createdAt)}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
