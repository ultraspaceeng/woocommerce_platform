# Royal Commerce Admin Panel - UI/UX Design System

A comprehensive design system documentation for building modern admin dashboards with Next.js, CSS Modules, and a dark-first approach.

---

## 🎨 Color Palette

### Primary Colors (Dark Theme)

```css
/* Background Layers */
--admin-bg: #0a0a0b;           /* Deepest background */
--admin-bg-card: #111113;      /* Card/container background */
--admin-bg-hover: #18181b;     /* Hover states */
--admin-bg-active: #1f1f23;    /* Active/pressed states */

/* Borders */
--admin-border: #27272a;       /* Primary borders */
--admin-border-light: #3f3f46; /* Subtle/hover borders */

/* Text Hierarchy */
--admin-text: #fafafa;         /* Primary text */
--admin-text-secondary: #a1a1aa; /* Secondary text */
--admin-text-muted: #71717a;   /* Muted/placeholder text */
--admin-text-disabled: #52525b; /* Disabled text */

/* Accent Gradient */
--admin-accent: #6366f1;       /* Primary accent (Indigo) */
--admin-accent-hover: #818cf8; /* Lighter accent */
--admin-accent-gradient: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
```

### Semantic Colors

```css
/* Status Colors */
--admin-success: #22c55e;      /* Success green */
--admin-success-light: #4ade80;
--admin-success-bg: rgba(34, 197, 94, 0.15);

--admin-warning: #eab308;      /* Warning yellow */
--admin-warning-light: #facc15;
--admin-warning-bg: rgba(234, 179, 8, 0.15);

--admin-error: #ef4444;        /* Error red */
--admin-error-light: #f87171;
--admin-error-bg: rgba(239, 68, 68, 0.15);

--admin-info: #3b82f6;         /* Info blue */
--admin-info-light: #60a5fa;
--admin-info-bg: rgba(59, 130, 246, 0.15);

/* Icon Color Variants */
--icon-purple-bg: rgba(99, 102, 241, 0.15);
--icon-purple: #818cf8;
--icon-blue-bg: rgba(59, 130, 246, 0.15);
--icon-blue: #60a5fa;
--icon-green-bg: rgba(34, 197, 94, 0.15);
--icon-green: #4ade80;
--icon-orange-bg: rgba(249, 115, 22, 0.15);
--icon-orange: #fb923c;
```

---

## 📐 Layout System

### Dimensions

```css
--admin-sidebar-width: 260px;
--admin-header-height: 64px;
```

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│                    Fixed Sidebar (260px)                │
│ ┌─────────┬───────────────────────────────────────────┐ │
│ │ Sidebar │              Header (64px)                │ │
│ │         ├───────────────────────────────────────────┤ │
│ │  Logo   │                                           │ │
│ │  Nav    │              Main Content                 │ │
│ │ Sections│              (padding: 1.5rem)            │ │
│ │         │                                           │ │
│ │  User   │                                           │ │
│ │  Card   │                                           │ │
│ └─────────┴───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### CSS Implementation

```css
.adminLayout {
    min-height: 100vh;
    background-color: #0a0a0b;
    color: #fafafa;
}

.adminMain {
    margin-left: 260px; /* Sidebar width */
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

/* Responsive: Collapse sidebar on mobile */
@media (max-width: 1023px) {
    .adminMain { margin-left: 0; }
    .adminSidebar { transform: translateX(-100%); }
    .adminSidebar.open { transform: translateX(0); }
}
```

---

## 🧩 Component Patterns

### 1. Page Header

```tsx
<div className={styles.pageHeader}>
    <div>
        <h1 className={styles.pageTitle}>Dashboard</h1>
        <p className={styles.pageSubtitle}>Welcome back!</p>
    </div>
    <div className={styles.headerActions}>
        <button className={styles.primaryBtn}>Add Product</button>
    </div>
</div>
```

```css
.pageHeader {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
    gap: 1rem;
    flex-wrap: wrap;
}

.pageTitle {
    font-size: 1.75rem;
    font-weight: 700;
    color: #fafafa;
    margin-bottom: 0.25rem;
}

.pageSubtitle {
    font-size: 0.9375rem;
    color: #71717a;
}
```

### 2. Metric Cards

```tsx
<div className={styles.metricCard}>
    <div className={styles.metricHeader}>
        <div className={`${styles.metricIcon} ${styles.iconPurple}`}>
            <FiDollarSign size={20} />
        </div>
        <div className={`${styles.metricTrend} ${styles.trendUp}`}>
            <FiTrendingUp size={14} />
            +12.5%
        </div>
    </div>
    <div className={styles.metricValue}>₦2,450,000</div>
    <div className={styles.metricLabel}>Total Revenue</div>
</div>
```

```css
.metricCard {
    background-color: #111113;
    border: 1px solid #27272a;
    border-radius: 12px;
    padding: 1.25rem;
    transition: all 0.2s ease;
}

.metricCard:hover {
    border-color: #3f3f46;
    transform: translateY(-2px);
}

.metricIcon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
}

.iconPurple {
    background: rgba(99, 102, 241, 0.15);
    color: #818cf8;
}

.metricTrend {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
}

.trendUp {
    background: rgba(34, 197, 94, 0.15);
    color: #4ade80;
}
```

### 3. Data Tables

```css
.tableCard {
    background: #111113;
    border: 1px solid #27272a;
    border-radius: 12px;
    overflow: hidden;
}

.table {
    width: 100%;
    border-collapse: collapse;
}

.table th {
    background: #0a0a0b;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #52525b;
    padding: 0.875rem 1rem;
    text-align: left;
}

.table td {
    padding: 0.875rem 1rem;
    border-bottom: 1px solid #27272a;
}

.table tbody tr:hover {
    background: #18181b;
}
```

### 4. Status Badges

```css
.badge {
    display: inline-flex;
    padding: 0.25rem 0.625rem;
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: capitalize;
    border-radius: 9999px;
}

.badge.success {
    background: rgba(34, 197, 94, 0.15);
    color: #4ade80;
}

.badge.warning {
    background: rgba(234, 179, 8, 0.15);
    color: #facc15;
}

.badge.error {
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
}

.badge.info {
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
}
```

### 5. Primary Button

```css
.primaryBtn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    font-size: 0.875rem;
    font-weight: 500;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
}

.primaryBtn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}
```

### 6. Search Input

```css
.searchWrapper {
    position: relative;
    flex: 1;
    max-width: 320px;
}

.searchIcon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #52525b;
    pointer-events: none;
}

.searchInput {
    width: 100%;
    height: 40px;
    padding: 0 1rem 0 40px;
    background-color: #18181b;
    border: 1px solid #27272a;
    border-radius: 8px;
    color: #fafafa;
    font-size: 0.875rem;
}

.searchInput:focus {
    outline: none;
    border-color: #6366f1;
    background-color: #111113;
}
```

### 7. Card Sections

```css
.card {
    background: #111113;
    border: 1px solid #27272a;
    border-radius: 12px;
    padding: 1.25rem;
}

.cardHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
}

.cardTitle {
    font-size: 1rem;
    font-weight: 600;
    color: #fafafa;
}
```

---

## 🎭 Animations

### Page Entry Animation

```css
.page {
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from { 
        opacity: 0; 
        transform: translateY(8px); 
    }
    to { 
        opacity: 1; 
        transform: translateY(0); 
    }
}
```

### Transition Standards

```css
/* Fast: Hovers, small elements */
transition: all 0.15s ease;

/* Base: Most interactions */
transition: all 0.2s ease;

/* Slow: Large animations, page transitions */
transition: all 0.3s ease;
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile first approach */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg - Sidebar appears */ }
@media (min-width: 1280px) { /* xl */ }
```

### Grid Patterns

```css
/* Metrics Grid */
.metricsGrid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 1rem;
}

@media (min-width: 640px) {
    .metricsGrid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) {
    .metricsGrid { grid-template-columns: repeat(4, 1fr); }
}
```

---

## 🗂️ Sidebar Structure

### Navigation Sections

```tsx
const navSections = [
    {
        title: 'Overview',
        items: [
            { href: '/admin/dashboard', label: 'Dashboard', icon: FiGrid },
            { href: '/admin/analytics', label: 'Analytics', icon: FiTrendingUp },
        ]
    },
    {
        title: 'Commerce',
        items: [
            { href: '/admin/products', label: 'Products', icon: FiPackage },
            { href: '/admin/orders', label: 'Orders', icon: FiShoppingCart, badge: 'New' },
            { href: '/admin/categories', label: 'Categories', icon: FiTag },
            { href: '/admin/inventory', label: 'Inventory', icon: FiArchive },
        ]
    },
    {
        title: 'Management',
        items: [
            { href: '/admin/users', label: 'Customers', icon: FiUsers },
            { href: '/admin/settings', label: 'Settings', icon: FiSettings },
        ]
    }
];
```

### Sidebar CSS

```css
.adminSidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 260px;
    background-color: #0a0a0b;
    border-right: 1px solid #27272a;
    display: flex;
    flex-direction: column;
    z-index: 100;
}

.navLink {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 0.75rem;
    color: #a1a1aa;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
}

.navLink:hover {
    background-color: #18181b;
    color: #fafafa;
}

.navLink.active {
    background-color: rgba(99, 102, 241, 0.15);
    color: #818cf8;
}
```

---

## 🔤 Typography

```css
/* Font Stack */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Heading Sizes */
h1 { font-size: 1.75rem; font-weight: 700; }
h2 { font-size: 1.25rem; font-weight: 600; }
h3 { font-size: 1rem; font-weight: 600; }

/* Body Text */
body { font-size: 0.875rem; }
small { font-size: 0.75rem; }
caption { font-size: 0.6875rem; }

/* Labels */
.label {
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #52525b;
}
```

---

## 📂 File Structure

```
app/admin/
├── page.tsx                    # Login page
├── page.module.css
├── admin.css                   # Design system variables
└── (dashboard)/
    ├── layout.tsx              # Dashboard layout with sidebar
    ├── layout.module.css
    ├── dashboard/
    │   ├── page.tsx
    │   └── page.module.css
    ├── products/
    │   ├── page.tsx
    │   ├── page.module.css
    │   └── [id]/
    │       ├── page.tsx
    │       └── page.module.css
    ├── orders/
    ├── users/
    ├── settings/
    ├── analytics/
    ├── categories/
    └── inventory/

components/layout/admin-sidebar/
├── index.tsx
└── admin-sidebar.module.css
```

---

## 🎯 Usage Guidelines

### Creating a New Admin Page

1. Create page folder under `app/admin/(dashboard)/`
2. Use the page entry animation
3. Include Page Header (title + subtitle + actions)
4. Use appropriate grid for content
5. Follow the color/spacing conventions

### Styling Checklist

- [ ] Use `#111113` for card backgrounds
- [ ] Use `#27272a` for borders
- [ ] Use `12px` (0.75rem) border-radius for cards
- [ ] Use `8px` (0.5rem) border-radius for buttons/inputs
- [ ] Use gradient for primary actions
- [ ] Include hover states with `translateY(-1px)` or `-2px`
- [ ] Add `0.15s` transitions for micro-interactions
- [ ] Use `0.6875rem` (11px) for small labels/badges

---

## 🛠️ Icon Library

Using `react-icons/fi` (Feather Icons):

```tsx
import { 
    FiGrid, FiPackage, FiShoppingCart, FiUsers, 
    FiSettings, FiTrendingUp, FiDollarSign, FiTag,
    FiSearch, FiPlus, FiEdit2, FiTrash2, FiEye,
    FiDownload, FiFilter, FiMoreVertical
} from 'react-icons/fi';
```

Standard icon sizes:
- Navigation: `18px`
- Card icons: `20px`
- Large icons: `24px`
- Inline with text: `14-16px`

---

## 📋 Quick Reference

| Element | Background | Border | Radius |
|---------|------------|--------|--------|
| Page | #0a0a0b | — | — |
| Card | #111113 | #27272a | 12px |
| Input | #18181b | #27272a | 8px |
| Button | gradient | — | 8px |
| Badge | semantic-bg | — | 9999px |
| Avatar | gradient | — | 9999px |

---

*This design system is optimized for dark-theme admin dashboards and e-commerce management interfaces.*
