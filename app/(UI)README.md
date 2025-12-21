# FlashMailPro Admin Panel - UI/UX Design System

A comprehensive design system documentation for building modern admin and app dashboards with Next.js, CSS Modules, and **theme-aware styling** (light and dark mode support).

---

## 🎨 Theme System

### Theme-Aware Approach

The design system uses CSS custom properties with **light mode as default** and **automatic dark mode** via `prefers-color-scheme`. This ensures the UI adapts to the user's system preferences.

```css
/* Light mode is the default */
:root {
    --admin-bg: #ffffff;
    --admin-text: #18181b;
    --admin-accent: #3b82f6;
}

/* Dark mode activates automatically */
@media (prefers-color-scheme: dark) {
    :root {
        --admin-bg: #0a0a0b;
        --admin-text: #fafafa;
        --admin-accent: #3b82f6;
    }
}
```

---

## 🎨 Color Palette

### Light Mode (Default)

```css
/* Background Layers */
--admin-bg: #ffffff;           /* Page background */
--admin-bg-card: #ffffff;      /* Card/container background */
--admin-bg-hover: #f4f4f5;     /* Hover states */
--admin-bg-active: #e4e4e7;    /* Active/pressed states */

/* Borders */
--admin-border: #e4e4e7;       /* Primary borders */
--admin-border-light: #d4d4d8; /* Subtle/hover borders */

/* Text Hierarchy */
--admin-text: #18181b;         /* Primary text (near-black) */
--admin-text-secondary: #52525b; /* Secondary text */
--admin-text-muted: #71717a;   /* Muted/placeholder text */
--admin-text-disabled: #a1a1aa; /* Disabled text */

/* Accent - Blue */
--admin-accent: #3b82f6;       /* Primary accent (Blue) */
--admin-accent-hover: #2563eb; /* Darker accent */
--admin-accent-gradient: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
--admin-accent-bg: rgba(59, 130, 246, 0.1);

/* Shadows */
--admin-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--admin-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--admin-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
```

### Dark Mode (Auto via `prefers-color-scheme`)

```css
@media (prefers-color-scheme: dark) {
    /* Background Layers */
    --admin-bg: #0a0a0b;           /* Deepest background */
    --admin-bg-card: #111113;      /* Card/container background */
    --admin-bg-hover: #18181b;     /* Hover states */
    --admin-bg-active: #1f1f23;    /* Active/pressed states */

    /* Borders */
    --admin-border: #27272a;       /* Primary borders */
    --admin-border-light: #3f3f46; /* Subtle/hover borders */

    /* Text Hierarchy */
    --admin-text: #fafafa;         /* Primary text (white) */
    --admin-text-secondary: #a1a1aa;
    --admin-text-muted: #71717a;
    --admin-text-disabled: #52525b;

    /* Shadows (deeper for dark mode) */
    --admin-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
    --admin-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
    --admin-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
}
```

### Semantic Colors (Same for Both Themes)

```css
/* Status Colors */
--admin-success: #22c55e;
--admin-success-bg: rgba(34, 197, 94, 0.1);

--admin-warning: #eab308;
--admin-warning-bg: rgba(234, 179, 8, 0.1);

--admin-error: #ef4444;
--admin-error-bg: rgba(239, 68, 68, 0.1);

--admin-info: #3b82f6;
--admin-info-bg: rgba(59, 130, 246, 0.1);

/* Icon Color Variants */
--icon-purple-bg: rgba(99, 102, 241, 0.1);
--icon-purple: #6366f1;
--icon-blue-bg: rgba(59, 130, 246, 0.1);
--icon-blue: #3b82f6;
--icon-green-bg: rgba(34, 197, 94, 0.1);
--icon-green: #22c55e;
--icon-orange-bg: rgba(249, 115, 22, 0.1);
--icon-orange: #f97316;
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

### CSS Implementation (Theme-Aware)

```css
.adminLayout {
    min-height: 100vh;
    background-color: var(--admin-bg);
    color: var(--admin-text);
}

.adminMain {
    margin-left: var(--admin-sidebar-width);
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
.pageTitle {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--admin-text);
}

.pageSubtitle {
    font-size: 0.9375rem;
    color: var(--admin-text-muted);
}
```

### 2. Metric Cards (Theme-Aware)

```css
.metricCard {
    background-color: var(--admin-bg-card);
    border: 1px solid var(--admin-border);
    border-radius: 12px;
    padding: 1.25rem;
    box-shadow: var(--admin-shadow-sm);
    transition: all 0.2s ease;
}

.metricCard:hover {
    border-color: var(--admin-border-light);
    transform: translateY(-2px);
    box-shadow: var(--admin-shadow-md);
}

.metricValue {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--admin-text);
}

.metricLabel {
    font-size: 0.875rem;
    color: var(--admin-text-muted);
}
```

### 3. Data Tables (Theme-Aware)

```css
.tableCard {
    background: var(--admin-bg-card);
    border: 1px solid var(--admin-border);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: var(--admin-shadow-sm);
}

.table th {
    background: var(--admin-bg-hover);
    color: var(--admin-text-muted);
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
}

.table td {
    padding: 0.875rem 1rem;
    border-bottom: 1px solid var(--admin-border);
    color: var(--admin-text);
}

.table tbody tr:hover {
    background: var(--admin-bg-hover);
}
```

### 4. Status Badges

```css
.badge {
    display: inline-flex;
    padding: 0.25rem 0.625rem;
    font-size: 0.6875rem;
    font-weight: 600;
    border-radius: 9999px;
}

.badge.success {
    background: var(--admin-success-bg);
    color: var(--admin-success);
}

.badge.warning {
    background: var(--admin-warning-bg);
    color: var(--admin-warning);
}

.badge.error {
    background: var(--admin-error-bg);
    color: var(--admin-error);
}

.badge.info {
    background: var(--admin-info-bg);
    color: var(--admin-info);
}
```

### 5. Primary Button (Blue Accent)

```css
.primaryBtn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    background: var(--admin-accent-gradient);
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
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}
```

### 6. Form Inputs (Theme-Aware)

```css
.input {
    width: 100%;
    padding: 0.75rem 1rem;
    background: var(--admin-bg);
    border: 1px solid var(--admin-border);
    border-radius: 8px;
    color: var(--admin-text);
    font-size: 0.875rem;
    transition: all 0.15s ease;
}

.input:focus {
    outline: none;
    border-color: var(--admin-accent);
    box-shadow: 0 0 0 3px var(--admin-accent-bg);
}

.input::placeholder {
    color: var(--admin-text-muted);
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
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
}
```

### Transition Standards

```css
--admin-transition: 0.15s ease;      /* Fast: Hovers, small elements */
--admin-transition-slow: 0.3s ease;  /* Slow: Large animations */
```

---

## 📱 Responsive Breakpoints

```css
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg - Sidebar appears */ }
@media (min-width: 1280px) { /* xl */ }
```

---

## 📂 File Structure

```
app/admin/
├── admin.css                   # Design system variables (theme-aware)
├── page.tsx                    # Login page
└── (dashboard)/
    ├── layout.tsx              # Dashboard layout with sidebar
    └── [pages]/

app/app/
├── app.css                     # App design system (theme-aware)
└── (dashboard)/
    ├── layout.tsx              # App dashboard layout
    └── [pages]/

components/
├── admin-sidebar.tsx
├── admin-sidebar.module.css    # Theme-aware sidebar styles
├── admin-header.tsx
├── admin-header.module.css     # Theme-aware header styles
├── app-sidebar.tsx
├── app-sidebar.module.css
├── app-header.tsx
└── app-header.module.css
```

---

## 🎯 Styling Checklist

- [x] Use CSS variables for all colors (theme-aware)
- [x] Use `var(--admin-bg-card)` for card backgrounds
- [x] Use `var(--admin-border)` for borders
- [x] Use `12px` border-radius for cards
- [x] Use `8px` border-radius for buttons/inputs
- [x] Use blue accent gradient for primary actions
- [x] Include hover states with `translateY(-1px)` or `-2px`
- [x] Add `0.15s` transitions for micro-interactions
- [x] Use `box-shadow: var(--admin-shadow-*)` for elevation

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

Standard icon sizes: Nav: `18px`, Card: `20px`, Large: `24px`, Inline: `14-16px`

---

## 📋 Quick Reference

| Element | Light BG | Dark BG | Border | Radius |
|---------|----------|---------|--------|--------|
| Page | #ffffff | #0a0a0b | — | — |
| Card | #ffffff | #111113 | var(--border) | 12px |
| Input | #ffffff | #18181b | var(--border) | 8px |
| Button | gradient | gradient | — | 8px |
| Badge | semantic | semantic | — | 9999px |

---

*This design system supports both light and dark themes, automatically adapting to user preferences via `prefers-color-scheme`.*
