'use client';

import { useEffect, useState, useCallback, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiSearch, FiPackage, FiChevronRight, FiChevronDown, FiGrid, FiList, FiFilter, FiStar, FiX } from 'react-icons/fi';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import ProductCard from '@/components/product/product-card';
import Button from '@/components/ui/button';
import MaintenanceOverlay from '@/components/ui/maintenance-overlay';
import { Product } from '@/types';
import { productsApi, categoriesApi } from '@/lib/services/api';
import { useCurrency } from '@/lib/hooks/use-currency';
import styles from './page.module.css';

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
        { value: 'all', label: 'All Products' },
    ]);
    const [brands, setBrands] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    // Filters
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [category, setCategory] = useState(searchParams.get('category') || 'all');
    const [type, setType] = useState(searchParams.get('type') || 'all');
    const [brand, setBrand] = useState(searchParams.get('brand') || 'all');
    const [priceRange, setPriceRange] = useState(searchParams.get('priceRange') || 'all');
    const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
    const [sortBy, setSortBy] = useState('recommended');

    const [debouncedSearch, setDebouncedSearch] = useState(search);
    const { priceInCurrency, currency, exchangeRate, format, convert }: any = useCurrency();

    const getCleanValue = (val: number) => {
        if (val === 0) return 0;
        const magnitude = Math.pow(10, Math.floor(Math.log10(val)));
        const normalized = val / magnitude;
        let cleanNormalized;
        if (normalized < 1.5) cleanNormalized = 1;
        else if (normalized < 3.5) cleanNormalized = 2.5;
        else if (normalized < 7.5) cleanNormalized = 5;
        else cleanNormalized = 10;
        return cleanNormalized * magnitude;
    };

    const priceRanges = useMemo(() => {
        const anchors = [0, 25000, 50000, 100000, 250000, 500000];
        const ranges = [];
        for (let i = 0; i < anchors.length; i++) {
            const minBase = anchors[i];
            const maxBase = anchors[i + 1] || null;
            const minDisp = getCleanValue(convert(minBase));
            const maxDisp = maxBase ? getCleanValue(convert(maxBase)) : null;
            let label = '';
            if (!maxDisp) label = `${format(minDisp)}+`;
            else label = `${format(minDisp)} - ${format(maxDisp)}`;
            ranges.push({ value: i.toString(), label, minDisp, maxDisp });
        }
        ranges.unshift({ value: 'all', label: 'All Prices', minDisp: 0, maxDisp: null });
        return ranges;
    }, [currency, exchangeRate, convert, format]);

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const catResponse = await categoriesApi.getAll();
                const dbCategories = catResponse.data.data as Category[];
                const categoryOptions = [
                    { value: 'all', label: 'All Products' },
                    ...dbCategories.map((cat) => ({
                        value: cat.slug,
                        label: cat.name,
                    })),
                ];
                setCategories(categoryOptions);

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

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { page, limit: 12 };
            if (debouncedSearch) params.search = debouncedSearch;
            if (category !== 'all') params.category = category;
            if (type !== 'all') params.type = type;
            if (brand !== 'all') params.brand = brand;
            if (priceRange !== 'all') {
                const range = priceRanges.find(r => r.value === priceRange);
                if (range) {
                    if (range.minDisp !== undefined) params.minPrice = range.minDisp * exchangeRate;
                    if (range.maxDisp !== undefined && range.maxDisp !== null) params.maxPrice = range.maxDisp * exchangeRate;
                }
            }
            if (sortBy !== 'recommended') params.sort = sortBy;

            const response = await productsApi.getAll(params);
            setProducts(response.data.data.products);
            setTotalPages(response.data.data.pagination.totalPages);
            setTotalProducts(response.data.data.pagination.total || response.data.data.products.length);
        } catch (error) {
            console.error('Failed to fetch products:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, category, type, brand, priceRange, sortBy, page, priceRanges, exchangeRate]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

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

    const hasActiveFilters = category !== 'all' || type !== 'all' || brand !== 'all' || priceRange !== 'all';

    // Sidebar filter component (reused for desktop and mobile)
    const FiltersSidebar = () => (
        <>
            <div className={styles.sidebarCard}>
                <div className={styles.sidebarHeader}>
                    <h3 className={styles.sidebarTitle}>Filters</h3>
                    {hasActiveFilters && (
                        <button className={styles.clearFilters} onClick={handleClearFilters}>Clear All</button>
                    )}
                </div>

                {/* Categories */}
                <div className={styles.filterSection}>
                    <div className={styles.filterSectionTitle}>
                        <span>Categories</span>
                        <FiChevronDown size={14} className={styles.filterSectionIcon} />
                    </div>
                    <div className={styles.categoryList}>
                        {categoriesLoading ? (
                            <span className={styles.categoryItem}>Loading...</span>
                        ) : (
                            categories.map((cat) => (
                                <div
                                    key={cat.value}
                                    className={`${styles.categoryItem} ${category === cat.value ? styles.active : ''}`}
                                    onClick={() => { setCategory(cat.value); setPage(1); }}
                                >
                                    <span>{cat.label}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Price Range */}
                <div className={styles.filterSection}>
                    <div className={styles.filterSectionTitle}>
                        <span>Price Range</span>
                        <FiChevronDown size={14} className={styles.filterSectionIcon} />
                    </div>
                    <div className={styles.categoryList}>
                        {priceRanges.map((range) => (
                            <div
                                key={range.value}
                                className={`${styles.categoryItem} ${priceRange === range.value ? styles.active : ''}`}
                                onClick={() => { setPriceRange(range.value); setPage(1); }}
                            >
                                <span>{range.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Product Type */}
                <div className={styles.filterSection}>
                    <div className={styles.filterSectionTitle}>
                        <span>Product Type</span>
                        <FiChevronDown size={14} className={styles.filterSectionIcon} />
                    </div>
                    <div className={styles.checkboxList}>
                        {types.map((t) => (
                            <label key={t.value} className={styles.checkboxItem}>
                                <input
                                    type="radio"
                                    name="type"
                                    checked={type === t.value}
                                    onChange={() => { setType(t.value); setPage(1); }}
                                    className={styles.checkboxInput}
                                />
                                <span className={styles.checkboxLabel}>{t.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Brands */}
                {brands.length > 0 && (
                    <div className={styles.filterSection}>
                        <div className={styles.filterSectionTitle}>
                            <span>Brands</span>
                            <FiChevronDown size={14} className={styles.filterSectionIcon} />
                        </div>
                        <div className={styles.checkboxList}>
                            <label className={styles.checkboxItem}>
                                <input
                                    type="radio"
                                    name="brand"
                                    checked={brand === 'all'}
                                    onChange={() => { setBrand('all'); setPage(1); }}
                                    className={styles.checkboxInput}
                                />
                                <span className={styles.checkboxLabel}>All Brands</span>
                            </label>
                            {brands.slice(0, 6).map((b) => (
                                <label key={b} className={styles.checkboxItem}>
                                    <input
                                        type="radio"
                                        name="brand"
                                        checked={brand === b}
                                        onChange={() => { setBrand(b); setPage(1); }}
                                        className={styles.checkboxInput}
                                    />
                                    <span className={styles.checkboxLabel}>{b}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );

    return (
        <>
            {/* Breadcrumb */}
            <nav className={styles.breadcrumb}>
                <Link href="/">Home</Link>
                <FiChevronRight size={14} />
                <span>Products</span>
            </nav>

            {/* Page Header */}
            <div className={styles.pageHeader}>
                <h1 className={styles.title}>All Products</h1>
                <p className={styles.subtitle}>Explore our curated collection of premium items</p>
            </div>

            {/* Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.searchContainer}>
                    <div className={styles.searchWrapper}>
                        <FiSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                </div>

                <div className={styles.toolbarRight}>
                    <button className={styles.filterToggle} onClick={() => setMobileFiltersOpen(true)}>
                        <FiFilter size={16} /> Filters
                    </button>

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

                    <div className={styles.viewToggle}>
                        <button className={`${styles.viewBtn} ${styles.active}`}><FiGrid size={16} /></button>
                        <button className={styles.viewBtn}><FiList size={16} /></button>
                    </div>

                    <span className={styles.resultCount}>{totalProducts} products</span>
                </div>
            </div>

            {/* Main Grid */}
            <div className={styles.gridContainer}>
                {/* Sidebar (Desktop) */}
                <aside className={styles.sidebar}>
                    <FiltersSidebar />
                </aside>

                {/* Products */}
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
                                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (page <= 3) {
                                            pageNum = i + 1;
                                        } else if (page >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = page - 2 + i;
                                        }
                                        return (
                                            <button
                                                key={pageNum}
                                                className={`${styles.pageButton} ${page === pageNum ? styles.active : ''}`}
                                                onClick={() => setPage(pageNum)}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
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
                            <p>Try adjusting your filters or search terms</p>
                            <Button variant="secondary" onClick={handleClearFilters}>
                                Clear Filters
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Filters Modal */}
            <div className={`${styles.mobileFilters} ${mobileFiltersOpen ? styles.open : ''}`} onClick={() => setMobileFiltersOpen(false)}>
                <div className={styles.mobileFiltersContent} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.mobileFiltersHeader}>
                        <h3 className={styles.mobileFiltersTitle}>Filters</h3>
                        <button className={styles.mobileFiltersClose} onClick={() => setMobileFiltersOpen(false)}>
                            <FiX size={18} />
                        </button>
                    </div>
                    <FiltersSidebar />
                </div>
            </div>
        </>
    );
}

export default function MarketPage() {
    return (
        <div className={styles.page}>
            <MaintenanceOverlay />
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
