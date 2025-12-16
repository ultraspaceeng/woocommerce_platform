'use client';

import { useState, useEffect } from 'react';
import { FiStar, FiCheck, FiUser, FiSend } from 'react-icons/fi';
import styles from './product-reviews.module.css';

interface Review {
    _id: string;
    customerName: string;
    rating: number;
    title?: string;
    comment: string;
    isVerifiedPurchase: boolean;
    createdAt: string;
}

interface ReviewsData {
    reviews: Review[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
    distribution: Record<number, number>;
}

interface ProductReviewsProps {
    productId: string;
    productRating?: number;
    ratingCount?: number;
}

export default function ProductReviews({ productId, productRating = 0, ratingCount = 0 }: ProductReviewsProps) {
    const [data, setData] = useState<ReviewsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        customerName: '',
        customerEmail: '',
        rating: 5,
        title: '',
        comment: '',
    });
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [hoverRating, setHoverRating] = useState(0);

    useEffect(() => {
        fetchReviews();
    }, [productId]);

    const fetchReviews = async () => {
        try {
            const response = await fetch(`/api/reviews?productId=${productId}`);
            const result = await response.json();
            if (result.success) {
                setData(result.data);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitMessage(null);

        try {
            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId,
                    ...formData,
                }),
            });

            const result = await response.json();

            if (result.success) {
                setSubmitMessage({ type: 'success', text: 'Thank you for your review!' });
                setFormData({ customerName: '', customerEmail: '', rating: 5, title: '', comment: '' });
                setShowForm(false);
                fetchReviews();
            } else {
                setSubmitMessage({ type: 'error', text: result.error || 'Failed to submit review' });
            }
        } catch (error) {
            setSubmitMessage({ type: 'error', text: 'Failed to submit review' });
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const renderStars = (rating: number, interactive = false) => {
        return (
            <div className={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <FiStar
                        key={star}
                        className={`${styles.star} ${star <= (interactive ? (hoverRating || formData.rating) : rating) ? styles.filled : ''}`}
                        onMouseEnter={() => interactive && setHoverRating(star)}
                        onMouseLeave={() => interactive && setHoverRating(0)}
                        onClick={() => interactive && setFormData({ ...formData, rating: star })}
                        style={interactive ? { cursor: 'pointer' } : undefined}
                    />
                ))}
            </div>
        );
    };

    const totalReviews = data?.pagination.total || ratingCount || 0;
    const avgRating = productRating || 0;

    return (
        <div className={styles.reviewsSection}>
            <h2 className={styles.sectionTitle}>Customer Reviews</h2>

            {/* Summary */}
            <div className={styles.summary}>
                <div className={styles.summaryLeft}>
                    <div className={styles.avgRating}>{avgRating.toFixed(1)}</div>
                    {renderStars(Math.round(avgRating))}
                    <span className={styles.totalReviews}>
                        Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Rating Distribution */}
                {data?.distribution && (
                    <div className={styles.distribution}>
                        {[5, 4, 3, 2, 1].map((star) => {
                            const count = data.distribution[star] || 0;
                            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                            return (
                                <div key={star} className={styles.distributionRow}>
                                    <span className={styles.starLabel}>{star} star</span>
                                    <div className={styles.barContainer}>
                                        <div className={styles.bar} style={{ width: `${percentage}%` }} />
                                    </div>
                                    <span className={styles.count}>{count}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Write Review Button */}
            <button className={styles.writeReviewBtn} onClick={() => setShowForm(!showForm)}>
                {showForm ? 'Cancel' : 'Write a Review'}
            </button>

            {/* Submit Message */}
            {submitMessage && (
                <div className={`${styles.message} ${styles[submitMessage.type]}`}>
                    {submitMessage.text}
                </div>
            )}

            {/* Review Form */}
            {showForm && (
                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label>Your Rating</label>
                        {renderStars(formData.rating, true)}
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Name *</label>
                            <input
                                type="text"
                                value={formData.customerName}
                                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                required
                                placeholder="Your name"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Email *</label>
                            <input
                                type="email"
                                value={formData.customerEmail}
                                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                                required
                                placeholder="your@email.com"
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Review Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Sum up your review in one line"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Your Review *</label>
                        <textarea
                            value={formData.comment}
                            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                            required
                            rows={4}
                            placeholder="Share your experience with this product..."
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={submitting}>
                        <FiSend size={16} />
                        {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                </form>
            )}

            {/* Reviews List */}
            <div className={styles.reviewsList}>
                {loading ? (
                    <p className={styles.loading}>Loading reviews...</p>
                ) : data?.reviews.length === 0 ? (
                    <p className={styles.noReviews}>No reviews yet. Be the first to review this product!</p>
                ) : (
                    data?.reviews.map((review) => (
                        <div key={review._id} className={styles.reviewCard}>
                            <div className={styles.reviewHeader}>
                                <div className={styles.reviewerInfo}>
                                    <div className={styles.avatar}>
                                        <FiUser size={20} />
                                    </div>
                                    <div>
                                        <span className={styles.reviewerName}>{review.customerName}</span>
                                        {review.isVerifiedPurchase && (
                                            <span className={styles.verifiedBadge}>
                                                <FiCheck size={12} /> Verified Purchase
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span className={styles.reviewDate}>{formatDate(review.createdAt)}</span>
                            </div>

                            <div className={styles.reviewRating}>
                                {renderStars(review.rating)}
                                {review.title && <span className={styles.reviewTitle}>{review.title}</span>}
                            </div>

                            <p className={styles.reviewComment}>{review.comment}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
