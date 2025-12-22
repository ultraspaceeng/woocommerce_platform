'use client';

import { useEffect, useState } from 'react';
import {
    FiBell, FiShoppingCart, FiTruck, FiPackage, FiStar,
    FiAlertCircle, FiCheck, FiCheckCircle, FiTrash2
} from 'react-icons/fi';
import Link from 'next/link';
import toast from 'react-hot-toast';
import styles from './page.module.css';

interface Notification {
    _id: string;
    type: 'new_order' | 'order_shipped' | 'order_delivered' | 'low_stock' | 'new_review' | 'system';
    title: string;
    message: string;
    data?: {
        orderId?: string;
        productId?: string;
        [key: string]: unknown;
    };
    isRead: boolean;
    createdAt: string;
}

const typeConfig = {
    new_order: { icon: FiShoppingCart, color: '#22c55e', label: 'New Order' },
    order_shipped: { icon: FiTruck, color: '#3b82f6', label: 'Shipped' },
    order_delivered: { icon: FiPackage, color: '#8b5cf6', label: 'Delivered' },
    low_stock: { icon: FiAlertCircle, color: '#f59e0b', label: 'Low Stock' },
    new_review: { icon: FiStar, color: '#eab308', label: 'Review' },
    system: { icon: FiBell, color: '#6b7280', label: 'System' },
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications?limit=50');
            const data = await res.json();
            if (data.success) {
                setNotifications(data.data);
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleMarkAsRead = async (id: string) => {
        try {
            const res = await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
            const data = await res.json();
            if (data.success) {
                setNotifications(prev =>
                    prev.map(n => n._id === id ? { ...n, isRead: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            const res = await fetch('/api/notifications/mark-all-read', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
                toast.success('All notifications marked as read');
            }
        } catch (error) {
            console.error('Failed to mark all as read:', error);
            toast.error('Failed to mark all as read');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                const notification = notifications.find(n => n._id === id);
                setNotifications(prev => prev.filter(n => n._id !== id));
                if (notification && !notification.isRead) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
                toast.success('Notification deleted');
            }
        } catch (error) {
            console.error('Failed to delete notification:', error);
            toast.error('Failed to delete notification');
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const getNotificationLink = (notification: Notification) => {
        if (notification.data?.orderId) {
            return `/admin/orders/${notification.data.orderId}`;
        }
        if (notification.data?.productId) {
            return `/admin/products/${notification.data.productId}`;
        }
        return null;
    };

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.loading}>Loading notifications...</div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>
                        <FiBell size={24} />
                        Notifications
                    </h1>
                    {unreadCount > 0 && (
                        <span className={styles.unreadBadge}>{unreadCount} unread</span>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button className={styles.markAllBtn} onClick={handleMarkAllRead}>
                        <FiCheckCircle size={16} />
                        Mark all as read
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className={styles.empty}>
                    <FiBell size={48} />
                    <h2>No notifications yet</h2>
                    <p>You'll see order updates, reviews, and system alerts here.</p>
                </div>
            ) : (
                <div className={styles.list}>
                    {notifications.map((notification) => {
                        const config = typeConfig[notification.type] || typeConfig.system;
                        const Icon = config.icon;
                        const link = getNotificationLink(notification);

                        const content = (
                            <div
                                className={`${styles.item} ${!notification.isRead ? styles.unread : ''}`}
                                onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
                            >
                                <div
                                    className={styles.iconWrapper}
                                    style={{ backgroundColor: `${config.color}20`, color: config.color }}
                                >
                                    <Icon size={20} />
                                </div>
                                <div className={styles.content}>
                                    <div className={styles.itemHeader}>
                                        <span className={styles.typeLabel} style={{ color: config.color }}>
                                            {config.label}
                                        </span>
                                        <span className={styles.time}>{formatTime(notification.createdAt)}</span>
                                    </div>
                                    <h3 className={styles.itemTitle}>{notification.title}</h3>
                                    <p className={styles.itemMessage}>{notification.message}</p>
                                </div>
                                <div className={styles.actions}>
                                    {!notification.isRead && (
                                        <button
                                            className={styles.actionBtn}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleMarkAsRead(notification._id);
                                            }}
                                            title="Mark as read"
                                        >
                                            <FiCheck size={16} />
                                        </button>
                                    )}
                                    <button
                                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleDelete(notification._id);
                                        }}
                                        title="Delete"
                                    >
                                        <FiTrash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );

                        return link ? (
                            <Link key={notification._id} href={link} className={styles.itemLink}>
                                {content}
                            </Link>
                        ) : (
                            <div key={notification._id}>{content}</div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
