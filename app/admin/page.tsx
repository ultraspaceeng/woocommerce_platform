'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiLock, FiMail, FiArrowRight } from 'react-icons/fi';
import { useAdminStore } from '@/lib/stores/admin-store';
import { authApi } from '@/lib/services/api';
import './admin.css';
import styles from './page.module.css';

export default function AdminLoginPage() {
    const router = useRouter();
    const { login } = useAdminStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authApi.adminLogin(email, password);
            if (response.data.success) {
                login(response.data.data.email, response.data.data.token);
                router.push('/admin/dashboard');
            }
        } catch {
            setError('Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.loginContainer}>
                {/* Left Side - Branding */}
                <div className={styles.brandingSide}>
                    <div className={styles.brandingContent}>
                        <div className={styles.logo}>
                            <span className={styles.logoIcon}>R</span>
                            <span className={styles.logoText}>Royal Commerce</span>
                        </div>
                        <h1 className={styles.brandingTitle}>
                            Manage Your Store<br />with Confidence
                        </h1>
                        <p className={styles.brandingSubtitle}>
                            Access your dashboard to manage products, orders, and customers all in one place.
                        </p>
                        <div className={styles.features}>
                            <div className={styles.feature}>
                                <span className={styles.featureIcon}>📦</span>
                                <span>Product Management</span>
                            </div>
                            <div className={styles.feature}>
                                <span className={styles.featureIcon}>📊</span>
                                <span>Sales Analytics</span>
                            </div>
                            <div className={styles.feature}>
                                <span className={styles.featureIcon}>🚀</span>
                                <span>Order Fulfillment</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className={styles.formSide}>
                    <div className={styles.formContainer}>
                        <div className={styles.formHeader}>
                            <h2 className={styles.formTitle}>Welcome back</h2>
                            <p className={styles.formSubtitle}>Sign in to your admin account</p>
                        </div>

                        <form onSubmit={handleSubmit} className={styles.form}>
                            {error && (
                                <div className={styles.error}>
                                    <span>⚠️</span>
                                    {error}
                                </div>
                            )}

                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Email</label>
                                <div className={styles.inputWrapper}>
                                    <FiMail className={styles.inputIcon} />
                                    <input
                                        type="email"
                                        className={styles.input}
                                        placeholder="admin@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Password</label>
                                <div className={styles.inputWrapper}>
                                    <FiLock className={styles.inputIcon} />
                                    <input
                                        type="password"
                                        className={styles.input}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className={styles.submitBtn}
                                disabled={loading}
                            >
                                {loading ? (
                                    'Signing in...'
                                ) : (
                                    <>
                                        Sign in
                                        <FiArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>

                        <p className={styles.footerText}>
                            Protected by Royal Commerce Security
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
