'use client';

import { useEffect, useState, useCallback, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FiFilter, FiPackage } from 'react-icons/fi';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import ProductCard from '@/components/product/product-card';
import Button from '@/components/ui/button';
import { Product } from '@/types';
import { productsApi, categoriesApi } from '@/lib/services/api';
import { useCurrency } from '@/lib/hooks/use-currency';
import styles from './page.module.css';

// Product type options
const types = [
    { value: 'all', label: 'All Types' },
    { value: 'physical', label: 'Physical' },
    { value: 'digital', label: 'Digital' },
];

interface Category {
    _id: string;
    name: string;
    slug: string;
    isActive: boolean;
}

function MarketContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<{ value: string; label: string }[]>([
        { value: 'all', label: 'All' }, // Used 'All' for simpler pill
    ]);
    const [brands, setBrands] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [category, setCategory] = useState(searchParams.get('category') || 'all');
    const [type, setType] = useState(searchParams.get('type') || 'all');
    const [brand, setBrand] = useState(searchParams.get('brand') || 'all');
    const [priceRange, setPriceRange] = useState(searchParams.get('priceRange') || 'all');
    const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));

    // Sort
    const [sortBy, setSortBy] = useState('recommended');

    const [debouncedSearch, setDebouncedSearch] = useState(search);
    const { priceInCurrency, currency, exchangeRate, format, convert }: any = useCurrency();

    // Dynamic price ranges based on currency
    // Helper to round numbers to clean 'nice' values (e.g. 33.5 -> 30, 480 -> 500)
    const getCleanValue = (val: number) => {
        if (val === 0) return 0;
        const magnitude = Math.pow(10, Math.floor(Math.log10(val)));
        const normalized = val / magnitude;

        let cleanNormalized;
        if (normalized < 1.5) cleanNormalized = 1;
        else if (normalized < 3.5) cleanNormalized = 2.5; // Allow 25, 250
        else if (normalized < 7.5) cleanNormalized = 5;
        else cleanNormalized = 10;

        return cleanNormalized * magnitude;
    };

    // Calculate dynamic price ranges
    const priceRanges = useMemo(() => {
        // Base anchors in NGN (assuming NGN is base)
        const anchors = [0, 25000, 50000, 100000, 250000, 500000];

        const ranges = [];
        for (let i = 0; i < anchors.length; i++) {
            const minBase = anchors[i];
            const maxBase = anchors[i + 1] || null;

            // Convert to current currency and clean up
            const minDisp = getCleanValue(convert(minBase));
            const maxDisp = maxBase ? getCleanValue(convert(maxBase)) : null;

            // Create label
            let label = '';
            if (!maxDisp) label = `${format(minDisp)}+`;
            else label = `${format(minDisp)} - ${format(maxDisp)}`;

            // Value is used to ID the range, loop index is safest or composite string
            ranges.push({
                value: i.toString(), // Use index or composite
                label,
                minDisp, // Store display values for UI logic if needed
                maxDisp,
                // We will recalculate 'Base' for API from these Disp values to ensure alignment
            });
        }
        // Add 'All' option
        ranges.unshift({ value: 'all', label: 'All Prices', minDisp: 0, maxDisp: null });
        return ranges;

    }, [currency, exchangeRate, convert, format]); // Recalculate when currency changes

    // Fetch categories and brands (initially)
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                // Fetch Categories
                const catResponse = await categoriesApi.getAll();
                const dbCategories = catResponse.data.data as Category[];
                const categoryOptions = [
                    { value: 'all', label: 'All' },
                    ...dbCategories.map((cat) => ({
                        value: cat.slug,
                        label: cat.name,
                    })),
                ];
                setCategories(categoryOptions);

                // Fetch a batch of products to extract distinct brands
                // Note: Ideally backend should have a /brands endpoint. 
                // For now, we fetch a larger batch to get available brands.
                const prodResponse = await productsApi.getAll({ limit: 100 });
                const fetchedProducts = prodResponse.data.data.products as Product[];
                const uniqueBrands = Array.from(new Set(fetchedProducts.map(p => p.brand).filter(Boolean))) as string[];
                setBrands(uniqueBrands.sort());

            } catch (error) {
                console.error('Failed to fetch metadata:', error);
            } finally {
                setCategoriesLoading(false);
            }
        };
        fetchMetadata();
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Fetch products
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            // Include 'brand' in params (cast to any or extend type definition if possible, but JS object works)
            const params: any = { page, limit: 12 };
            if (debouncedSearch) params.search = debouncedSearch;
            if (category !== 'all') params.category = category;
            if (type !== 'all') params.type = type;
            if (brand !== 'all') params.brand = brand;

            // Handle Price Range
            if (priceRange !== 'all') {
                const range = priceRanges.find(r => r.value === priceRange);
                if (range) {
                    // Reverse convert Display -> Base for API
                    // Since Display = Base / Rate, then Base = Display * Rate
                    if (range.minDisp !== undefined) params.minPrice = range.minDisp * exchangeRate;
                    if (range.maxDisp !== undefined && range.maxDisp !== null) params.maxPrice = range.maxDisp * exchangeRate;
                }
            }

            // Handle Sort
            // (Assuming backend supports sort, otherwise client-side sort might be needed)
            if (sortBy !== 'recommended') {
                params.sort = sortBy;
            }

            const response = await productsApi.getAll(params);
            setProducts(response.data.data.products);
            setTotalPages(response.data.data.pagination.totalPages);
        } catch (error) {
            console.error('Failed to fetch products:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, category, type, brand, priceRange, sortBy, page]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    // Update URL
    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (category !== 'all') params.set('category', category);
        if (type !== 'all') params.set('type', type);
        if (brand !== 'all') params.set('brand', brand);
        if (priceRange !== 'all') params.set('priceRange', priceRange);
        if (page > 1) params.set('page', page.toString());

        const queryString = params.toString();
        router.replace(`/market${queryString ? `?${queryString}` : ''}`, { scroll: false });
    }, [debouncedSearch, category, type, brand, priceRange, page, router]);

    const handleClearFilters = () => {
        setSearch('');
        setCategory('all');
        setType('all');
        setBrand('all');
        setPriceRange('all');
        setPage(1);
    };

    return (
        <>
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <div>
                        <h1 className={styles.title}>New Arrivals</h1>
                        <p className={styles.subTitle}>Check out the latest additions to our collection.</p>
                    </div>
                </div>

                <div className={styles.filterBar}>
                    {/* Search Input */}
                    <div className={styles.searchContainer}>
                        <div className={styles.searchWrapper}>
                            <FiFilter className={styles.searchIcon} />
                            <input
                                type="text"
                                placeholder="Search products, brands, categories..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={styles.searchInput}
                            />
                        </div>
                    </div>

                    {/* Categories Pills */}
                    <div className={styles.categoryRow}>
                        {categoriesLoading ? (
                            <button className={styles.categoryPill}>Loading...</button>
                        ) : (
                            categories.map((cat) => (
                                <button
                                    key={cat.value}
                                    className={`${styles.categoryPill} ${category === cat.value ? styles.active : ''}`}
                                    onClick={() => { setCategory(cat.value); setPage(1); }}
                                >
                                    {cat.label}
                                </button>
                            ))
                        )}
                    </div>

                    {/* Filters & Sort */}
                    <div className={styles.filtersRow}>
                        <div className={styles.filterGroup}>
                            {/* Product Type Dropdown */}
                            <select
                                className={styles.dropdownSelect}
                                value={type}
                                onChange={(e) => { setType(e.target.value); setPage(1); }}
                            >
                                {types.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>

                            {/* Brand Dropdown (Dynamic) */}
                            <select
                                className={styles.dropdownSelect}
                                value={brand}
                                onChange={(e) => { setBrand(e.target.value); setPage(1); }}
                            >
                                <option value="all">All Brands</option>
                                {brands.map(b => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>

                            {/* Price Filter */}
                            <select
                                className={styles.dropdownSelect}
                                value={priceRange}
                                onChange={(e) => { setPriceRange(e.target.value); setPage(1); }}
                            >
                                {priceRanges.map(range => (
                                    <option key={range.value} value={range.value}>{range.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.filterGroup}>
                            <span className={styles.filterLabel}>Sort:</span>
                            <select
                                className={styles.dropdownSelect}
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="recommended">Recommended</option>
                                <option value="newest">Newest</option>
                                <option value="price_asc">Price: Low to High</option>
                                <option value="price_desc">Price: High to Low</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.content}>
                <div className={styles.productsWrapper}>
                    {loading ? (
                        <div className={styles.loadingState}><p>Loading products...</p></div>
                    ) : products.length > 0 ? (
                        <>
                            <div className={styles.productsGrid}>
                                {products.map((product) => (
                                    <ProductCard key={product._id} product={product} />
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className={styles.pagination}>
                                    <button
                                        className={styles.pageButton}
                                        disabled={page === 1}
                                        onClick={() => setPage(page - 1)}
                                    >
                                        Prev
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => (
                                        <button
                                            key={i + 1}
                                            className={`${styles.pageButton} ${page === i + 1 ? styles.active : ''}`}
                                            onClick={() => setPage(i + 1)}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button
                                        className={styles.pageButton}
                                        disabled={page === totalPages}
                                        onClick={() => setPage(page + 1)}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className={styles.emptyState}>
                            <FiPackage className={styles.emptyIcon} />
                            <h3 className={styles.emptyTitle}>No products found</h3>
                            <p className={styles.emptyDescription}>Try adjusting your filters</p>
                            <Button variant="secondary" onClick={handleClearFilters}>
                                Clear Filters
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default function MarketPage() {
    return (
        <div className={styles.page}>
            <Header />
            <main className={styles.main}>
                <div className={styles.container}>
                    <Suspense fallback={<div className={styles.loadingState}><p>Loading...</p></div>}>
                        <MarketContent />
                    </Suspense>
                </div>
            </main>
            <Footer />
        </div>
    );
}
