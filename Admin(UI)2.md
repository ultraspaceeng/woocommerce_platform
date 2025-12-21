# Admin UI/UX Documentation
**File:** `Admin(UI)2.md`
**System:** Royal-Commerce Admin Panel
**Version:** 2.0

## 1. Overview
This documentation provides a comprehensive guide to reproducing the Stylings, Structure, and UI/UX patterns of the Admin section (`app/admin`). The Admin area operates as a distinct design system that inherits from the global application but applies specific overrides for a tailored dashboard experience.

## 2. Global Styling & Design Tokens

### 2.1 Base Configuration (`app/global.css`)
The application uses a variable-based design system defined in `app/global.css`.
-   **Typography**: `Bricolage Grotesque` (Google Font).
-   **Global Accent**: Royal Blue (`#4169E1`) - *Note: The Admin area overrides this.*
-   **Theme Support**: Native CSS variables via `[data-theme='dark']` and `prefers-color-scheme`.

### 2.2 Admin-Specific Overrides (`app/admin/admin.css`)
The admin section introduces a scoped design system. It uses specific css variables (`--admin-*`) which are mapped to the standard global variables within the `.adminLayout` class.

**Key Color Overlay:**
The Admin panel uses a simpler, high-contrast palette compared to the storefront.

| Variable | Light Mode (Value) | Dark Mode (Value) | Description |
| :--- | :--- | :--- | :--- |
| **Background** | `#ffffff` | `#0a0a0b` | Main page background |
| **Card Bg** | `#ffffff` | `#111113` | Panels and containers |
| **Border** | `#e4e4e7` | `#27272a` | Borders and dividers |
| **Accent** | `#4f46e5` (Indigo-600) | `#6366f1` (Indigo-500) | Primary action color |
| **Text** | `#09090b` | `#fafafa` | Primary text |

> **Important**: While the global app uses **Royal Blue**, the Admin area specifically overrides this to **Indigo** (`#6366f1` in dark mode) to distinguish the interface. To strictly enforce Royal Blue in a new admin section, you would need to adjust the `--admin-accent` variable.

## 3. Layout Structure

### 3.1 Directory Architecture
The Admin structure is isolated in `app/admin`:
```
app/admin/
├── admin.css          # Core admin variables and global overrides
├── (main)/            # Protected admin routes
│   ├── layout.tsx     # The Shell (Sidebar + Header + Content)
│   ├── layout.module.css # Styles for the Shell
│   ├── dashboard/     # Example Page
│   └── ...
```

### 3.2 The Admin Shell (`layout.tsx`)
The layout combines three key zones:
1.  **Sidebar (`.adminSidebar` / Fixed)**:
    -   Width: `260px`
    -   Position: Fixed, Left, Full Height.
    -   Responsive: Hidden on mobile (transform -100%), toggles via state.
2.  **Header (`.adminHeader` / Sticky)**:
    -   Height: `64px`
    -   Position: Sticky Top.
    -   Content: Breadcrumbs, Search, Theme Toggle, Profile.
3.  **Main Content (`.adminMain` / Fluid)**:
    -   Left Margin: `260px` (matches Sidebar width).
    -   Padding: `var(--space-xl)` (approx 2rem).

## 4. UI Components & Reproducibility
To create a new Admin Page that perfectly matches the existing UI, follow this pattern:

### 4.1 Page Skeleton
Create your page (`page.tsx`) and its module css (`page.module.css`).

**page.tsx:**
```tsx
'use client';
import styles from './page.module.css';

export default function NewAdminPage() {
    return (
        <div className={styles.page}>
            {/* 1. Header Section */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Page Title</h1>
                    <p className={styles.pageSubtitle}>Optional descriptive subtitle.</p>
                </div>
                <div className={styles.headerActions}>
                    {/* Action Buttons */}
                    <button className={styles.primaryBtn}>Primary Action</button>
                </div>
            </div>

            {/* 2. Content Grid */}
            <div className={styles.contentGrid}>
                {/* Your Cards/Tables go here */}
                <div className={styles.card}>
                    <h2>Section Title</h2>
                    <p>Content...</p>
                </div>
            </div>
        </div>
    );
}
```

### 4.2 Styling Guidelines (`page.module.css`)
Use the shared styling tokens. Do not hardcode hex values.

```css
/* Container */
.page {
    display: flex;
    flex-direction: column;
    gap: var(--space-xl); /* 2rem */
    max-width: 1600px;
}

/* Header Typography */
.pageTitle {
    font-size: 1.875rem; /* 30px */
    font-weight: 700;
    color: var(--color-text-primary);
    letter-spacing: -0.02em;
}

.pageSubtitle {
    color: var(--color-text-muted);
    margin-top: var(--space-xs);
}

/* Cards */
.card {
    background-color: var(--color-bg-tertiary); /* Uses mapped admin-bg-card */
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-lg);
}

/* Primary Button (Standard Admin Style) */
.primaryBtn {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    background-color: var(--admin-accent);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: var(--radius-md);
    font-weight: 500;
    transition: background-color var(--transition-fast);
}

.primaryBtn:hover {
    background-color: var(--admin-accent-hover);
}

/* 4.4 Settings & Form Patterns */
For configuration pages (like Settings), use the **Card + Form Group** pattern.

**Form Layout:**
```tsx
<div className={styles.settingsGrid}>
    <div className={styles.settingsCard}>
        <div className={styles.cardHeader}>
             <FiSettings size={20} />
             <h2>Section Title</h2>
        </div>
        <div className={styles.cardBody}>
             <div className={styles.formGroup}>
                 <label>Setting Name</label>
                 <input className={styles.input} />
             </div>
        </div>
    </div>
</div>
```

**Custom Toggle Switch:**
Do not use browser defaults. Use the custom toggle CSS found in `settings/page.module.css`:
```css
.toggle {
    width: 44px; height: 24px;
    background: var(--admin-border);
    border-radius: 12px;
    /* ... relative positioning ... */
}
.toggle.active { background: var(--admin-accent); }
```

### 4.5 Data Tables & Lists
For displaying collections (like Products or Orders), use the **Table Card** pattern.

**Toolbar Pattern:**
Always place a toolbar above the table for Search and Filtering.
```tsx
<div className={styles.toolbar}>
    <div className={styles.searchWrapper}>
        <FiSearch />
        <input placeholder="Search..." className={styles.searchInput} />
    </div>
    <div className={styles.filters}>
        <select className={styles.filterSelect}>...</select>
    </div>
</div>
```

**Table Structure:**
```tsx
<div className={styles.tableCard}>
    <table className={styles.table}>
        <thead>
            <tr>
                <th>Header</th>
                <th className={styles.actionsCell}>Actions</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Data</td>
                <td className={styles.actionsCell}>
                    <div className={styles.actions}>
                        <Link href="..." className={styles.actionBtn}><FiEdit2 /></Link>
                        <button className={`${styles.actionBtn} ${styles.deleteBtn}`}><FiTrash2 /></button>
                    </div>
                </td>
            </tr>
        </tbody>
    </table>
</div>
```

**Status Badges:**
Use `.statusBadge` with modifier classes `.active`, `.inactive`, `.pending`, `.success`.
```css
.statusBadge {
    display: inline-flex;
    padding: 0.25rem 0.625rem;
    font-size: 0.6875rem;
    font-weight: 600;
    border-radius: 9999px;
}
.statusBadge.active {
    background: var(--admin-success-bg);
    color: var(--admin-success-text);
}
```

**Empty States:**
When a list is empty, use the `.empty` container pattern.
```tsx
<div className={styles.empty}>
    <FiPackage size={48} />
    <h3>No items found</h3>
    <p>Get started by adding your first item</p>
    <Link href="..."><Button>Add Item</Button></Link>
</div>
```

**Bulk Actions:**
If the table supports selection, show a bulk action bar when items are selected.
```tsx
<div className={styles.bulkActions}>
    <span className={styles.selectedCount}>{count} selected</span>
    <button className={styles.bulkBtn}>Bulk Edit</button>
    <button className={styles.bulkBtnDanger}>Delete Selected</button>
</div>
```
```

### 4.3 Dark Mode / Light Mode
The system handles this automatically as long as you use the CSS variables:
-   `var(--color-bg-primary)`
-   `var(--color-text-primary)`
-   `var(--color-border)`

**Never** use raw colors like `#fff` or `#000` in your CSS modules.

## 5. Checklist for New Pages
1.  [ ] **Route**: Create folder in `app/admin/(main)/[feature]`.
2.  [ ] **Styles**: specific `.module.css` importing no other files (variables are global).
3.  [ ] **Structure**: Use the Header -> Grid -> Card pattern.
4.  [ ] **Icons**: Use `react-icons/fi` (Feather Icons) for consistency.
5.  [ ] **Responsiveness**: Ensure grids collapse to single column on mobile.

## 6. Accessing Admin Variables
If you need to tweak the Admin Theme locally (e.g. force Royal Blue), modify `app/admin/admin.css`:

```css
/* To force Royal Blue globally in Admin */
:root {
    --admin-accent: #4169E1; /* Change from Indigo to Royal Blue */
    --admin-accent-hover: #3457c9;
}
```
