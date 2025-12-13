'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FiSearch, FiFilter, FiX, FiPackage } from 'react-icons/fi';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import ProductCard from '@/components/product/product-card';
import Button from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Product } from '@/types';
import { productsApi, categoriesApi } from '@/lib/services/api';
import styles from './page.module.css';

// Product type options (static)
const types = [
    { value: 'all', label: 'All Types' },
    { value: 'physical', label: 'Physical Products' },
    { value: 'digital', label: 'Digital Products' },
];

// Category type for API response
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
        { value: 'all', label: 'All Categories' },
    ]);
    const [loading, setLoading] = useState(true);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);

    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [category, setCategory] = useState(searchParams.get('category') || 'all');
    const [type, setType] = useState(searchParams.get('type') || 'all');
    const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
    const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
    const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));

    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    const [debouncedSearch, setDebouncedSearch] = useState(search);

    // Fetch categories from database
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await categoriesApi.getAll();
                const dbCategories = response.data.data as Category[];
                const categoryOptions = [
                    { value: 'all', label: 'All Categories' },
                    ...dbCategories.map((cat) => ({
                        value: cat.slug,
                        label: cat.name,
                    })),
                ];
                setCategories(categoryOptions);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
                // Keep default "All Categories" if fetch fails
            } finally {
                setCategoriesLoading(false);
            }
        };

        fetchCategories();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, unknown> = { page, limit: 12 };
            if (debouncedSearch) params.search = debouncedSearch;
            if (category !== 'all') params.category = category;
            if (type !== 'all') params.type = type;
            if (minPrice) params.minPrice = parseFloat(minPrice);
            if (maxPrice) params.maxPrice = parseFloat(maxPrice);

            const response = await productsApi.getAll(params as Parameters<typeof productsApi.getAll>[0]);
            setProducts(response.data.data.products);
            setTotalPages(response.data.data.pagination.totalPages);
        } catch (error) {
            console.error('Failed to fetch products:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, category, type, minPrice, maxPrice, page]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (category !== 'all') params.set('category', category);
        if (type !== 'all') params.set('type', type);
        if (minPrice) params.set('minPrice', minPrice);
        if (maxPrice) params.set('maxPrice', maxPrice);
        if (page > 1) params.set('page', page.toString());
        const queryString = params.toString();
        router.replace(`/market${queryString ? `?${queryString}` : ''}`, { scroll: false });
    }, [debouncedSearch, category, type, minPrice, maxPrice, page, router]);

    const clearFilters = () => { setSearch(''); setCategory('all'); setType('all'); setMinPrice(''); setMaxPrice(''); setPage(1); };
    const hasActiveFilters = search || category !== 'all' || type !== 'all' || minPrice || maxPrice;

    const FilterContent = () => (
        <>
            <div className={styles.filterSection}>
                <h3 className={styles.filterTitle}>Category</h3>
                <div className={styles.filterOptions}>
                    {categoriesLoading ? (
                        <span className={styles.filterLoading}>Loading...</span>
                    ) : (
                        categories.map((cat) => (
                            <button
                                key={cat.value}
                                className={`${styles.filterOption} ${category === cat.value ? styles.active : ''}`}
                                onClick={() => { setCategory(cat.value); setPage(1); }}
                            >
                                {cat.label}
                            </button>
                        ))
                    )}
                </div>
            </div>
            <div className={styles.filterSection}>
                <h3 className={styles.filterTitle}>Product Type</h3>
                <div className={styles.filterOptions}>
                    {types.map((t) => (
                        <button key={t.value} className={`${styles.filterOption} ${type === t.value ? styles.active : ''}`} onClick={() => { setType(t.value); setPage(1); }}>{t.label}</button>
                    ))}
                </div>
            </div>
            <div className={styles.filterSection}>
                <h3 className={styles.filterTitle}>Price Range</h3>
                <div className={styles.priceInputs}>
                    <Input placeholder="Min" type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} inputSize="sm" />
                    <span className={styles.priceSeparator}>-</span>
                    <Input placeholder="Max" type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} inputSize="sm" />
                </div>
            </div>
            {hasActiveFilters && (<button className={styles.clearFilters} onClick={clearFilters}><FiX size={16} />Clear All Filters</button>)}
        </>
    );

    return (
        <>
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <h1 className={styles.title}>Market</h1>
                    <span className={styles.productCount}>{loading ? 'Loading...' : `${products.length} products`}</span>
                </div>
                <div className={styles.searchBar}>
                    <FiSearch className={styles.searchIcon} size={20} />
                    <input type="text" className={styles.searchInput} placeholder="Search products..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                </div>
                <button className={styles.mobileFilterToggle} onClick={() => setMobileFilterOpen(!mobileFilterOpen)}><FiFilter size={18} />Filters{hasActiveFilters && ' (Active)'}</button>
            </div>

            <div className={styles.content}>
                <aside className={styles.sidebar}><FilterContent /></aside>
                <div className={`${styles.mobileSidebar} ${mobileFilterOpen ? styles.open : ''}`}><FilterContent /><Button fullWidth onClick={() => setMobileFilterOpen(false)} style={{ marginTop: 'var(--space-lg)' }}>Apply Filters</Button></div>

                <div className={styles.productsWrapper}>
                    {loading ? (
                        <div className={styles.loadingState}><p>Loading products...</p></div>
                    ) : products.length > 0 ? (
                        <>
                            <div className={styles.productsGrid}>{products.map((product) => (<ProductCard key={product._id} product={product} />))}</div>
                            {totalPages > 1 && (
                                <div className={styles.pagination}>
                                    <button className={styles.pageButton} disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
                                    {Array.from({ length: totalPages }, (_, i) => (<button key={i + 1} className={`${styles.pageButton} ${page === i + 1 ? styles.active : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>))}
                                    <button className={styles.pageButton} disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className={styles.emptyState}>
                            <FiPackage className={styles.emptyIcon} />
                            <h3 className={styles.emptyTitle}>No products found</h3>
                            <p className={styles.emptyDescription}>Try adjusting your search or filters</p>
                            {hasActiveFilters && (<Button variant="secondary" onClick={clearFilters}>Clear Filters</Button>)}
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
