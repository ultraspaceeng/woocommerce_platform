import Link from 'next/link';
import { FiTwitter, FiInstagram, FiFacebook } from 'react-icons/fi';
import styles from './footer.module.css';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.grid}>
                    <div className={styles.brand}>
                        <Link href="/" className={styles.logo}>
                            <span className={styles.logoIcon}>R</span>
                            Royal Commerce
                        </Link>
                        <p className={styles.description}>
                            Your premium destination for quality physical and digital products.
                            Experience shopping like royalty.
                        </p>
                        <div className={styles.social}>
                            <a href="#" className={styles.socialLink} aria-label="Twitter">
                                <FiTwitter size={18} />
                            </a>
                            <a href="#" className={styles.socialLink} aria-label="Instagram">
                                <FiInstagram size={18} />
                            </a>
                            <a href="#" className={styles.socialLink} aria-label="Facebook">
                                <FiFacebook size={18} />
                            </a>
                        </div>
                    </div>

                    <div className={styles.column}>
                        <h3>Shop</h3>
                        <div className={styles.links}>
                            <Link href="/market">All Products</Link>
                            <Link href="/market?type=physical">Physical Goods</Link>
                            <Link href="/market?type=digital">Digital Products</Link>
                        </div>
                    </div>

                    <div className={styles.column}>
                        <h3>Support</h3>
                        <div className={styles.links}>
                            <Link href="/order-tracking">Track Order</Link>
                            <Link href="/#contact">Contact Us</Link>
                            <Link href="#">FAQs</Link>
                        </div>
                    </div>

                    <div className={styles.column}>
                        <h3>Company</h3>
                        <div className={styles.links}>
                            <Link href="/#about">About Us</Link>
                            <Link href="#">Privacy Policy</Link>
                            <Link href="#">Terms of Service</Link>
                        </div>
                    </div>
                </div>

                <hr className={styles.divider} />

                <div className={styles.bottom}>
                    <p className={styles.copyright}>
                        © {currentYear} Royal Commerce. All rights reserved.
                    </p>
                    <div className={styles.bottomLinks}>
                        <Link href="#">Privacy</Link>
                        <Link href="#">Terms</Link>
                        <Link href="#">Cookies</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
