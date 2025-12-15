# UI2 Design Documentation

## Overview
This documentation outlines the design patterns, UI/UX principles, and layout structures used in the `app/admin` section (specifically the Settings page). It is intended as a guide for recreating this premium, dark-mode-first aesthetic in other projects.

**Key Characteristics:**
- **Theme:** Rich Dark Mode (Not absolute black, but deep zinc/slate grays).
- **Accent:** Indigo/Violet gradients (`#6366f1` to `#8b5cf6`).
- **Surface:** Subtle depth using slightly lighter backgrounds for cards vs. page background.
- **Interaction:** Smooth transitions (0.15s - 0.2s), hover states, and focus rings.

---

## 1. Design Tokens (CSS Variables)

Define these in your global CSS or a dedicated variables file.

```css
:root {
    /* Layout Dimensions */
    --admin-sidebar-width: 260px;
    --admin-header-height: 64px;
    
    /* Colors: Backgrounds */
    --admin-bg: #0a0a0b;        /* Main Page Background (Deepest) */
    --admin-bg-card: #111113;   /* Card Surface */
    --admin-bg-hover: #18181b;  /* Hover State / Inputs */
    --admin-bg-active: #1f1f23; /* Active State */
    
    /* Colors: Borders */
    --admin-border: #27272a;       /* Standard Border */
    --admin-border-light: #3f3f46; /* Lighter Border (e.g., hover) */
    
    /* Colors: Text */
    --admin-text: #fafafa;           /* Primary Text */
    --admin-text-secondary: #a1a1aa; /* Secondary Text */
    --admin-text-muted: #71717a;     /* Muted/Placeholder */
    
    /* Colors: Brand/Accent */
    --admin-accent: #6366f1;         /* Primary Brand Color (Indigo-500) */
    --admin-accent-hover: #818cf8;   /* Hover Brand Color (Indigo-400) */
    --admin-accent-light: rgba(99, 102, 241, 0.1); /* Subtle Accent Background */
    
    /* Colors: Status */
    --admin-success: #22c55e;
    --admin-warning: #eab308;
    --admin-error: #ef4444;
    --admin-info: #3b82f6;

    /* Spacing & Radius */
    --space-xs: 0.25rem;
    --space-sm: 0.5rem;
    --space-md: 0.75rem;
    --space-lg: 1rem;
    --space-xl: 1.5rem;
    
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-full: 9999px;
    
    /* Transitions */
    --transition-fast: 0.15s ease;
    --transition-base: 0.2s ease;
}

[data-theme='light'] {
    /* Admin-specific colors (Light Mode) */
    --admin-bg: #f9fafb;        /* Zinc 50 */
    --admin-bg-card: #ffffff;   /* White */
    --admin-bg-hover: #f3f4f6;  /* Zinc 100 */
    --admin-bg-active: #e5e7eb; /* Zinc 200 */
    --admin-border: #e4e4e7;    /* Zinc 200 */
    --admin-border-light: #f4f4f5; /* Zinc 100 */

    --admin-text: #09090b;      /* Zinc 950 */
    --admin-text-secondary: #52525b; /* Zinc 600 */
    --admin-text-muted: #a1a1aa;     /* Zinc 400 */

    --admin-accent: #6366f1;         /* Indigo 500 */
    --admin-accent-hover: #4f46e5;   /* Indigo 600 */
    --admin-accent-light: rgba(99, 102, 241, 0.08);

    --admin-border: #e4e4e7;
}
```

---

## 2. Layout Structure

The layout consists of a fixed Sidebar (left), a Sticky Header (top), and a Scrollable Main Content area.

### AdminLayout
The wrapper that positions the sidebar and main content.

```css
.adminLayout {
    min-height: 100vh;
    background-color: var(--admin-bg);
    color: var(--admin-text);
}

.adminMain {
    margin-left: var(--admin-sidebar-width); /* Push content right */
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    transition: margin-left var(--transition-base);
}

/* Mobile Responsive */
@media (max-width: 1023px) {
    .adminMain { margin-left: 0; }
}
```

### Sidebar
Fixed width, fixed position.

```css
.adminSidebar {
    position: fixed;
    top: 0; left: 0; bottom: 0;
    width: var(--admin-sidebar-width);
    background-color: var(--admin-bg);
    border-right: 1px solid var(--admin-border);
    z-index: 100;
}
```

---

## 3. UI Components (The "Settings" Pattern)

The `Settings` page uses a **Card Grid** layout.

### A. The Grid
Responsive grid that switches from 1 column (mobile) to 2 columns (desktop).

```css
.settingsGrid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
}

@media (min-width: 1024px) {
    .settingsGrid {
        grid-template-columns: repeat(2, 1fr);
    }
}
```

### B. Settings Card
The core container for grouped settings.

```css
.settingsCard {
    background: var(--admin-bg-card); /* #111113 */
    border: 1px solid var(--admin-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
}

.cardHeader {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    background: var(--admin-bg); /* #0a0a0b */
    border-bottom: 1px solid var(--admin-border);
}

.cardBody {
    padding: 1.25rem;
}
```

### C. Input Fields
Dark, subtle inputs that glow with the accent color on focus.

```css
.input {
    width: 100%;
    height: 40px;
    padding: 0 0.875rem;
    background: var(--admin-bg-hover); /* #18181b */
    border: 1px solid var(--admin-border);
    border-radius: var(--radius-md);
    color: var(--admin-text);
    font-size: 0.875rem;
    transition: all var(--transition-fast);
}

.input:focus {
    outline: none;
    border-color: var(--admin-accent);
    background: var(--admin-bg-card);
}
```

### D. Primary Button
Uses a gradient for visual pop.

```css
.saveBtn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    font-size: 0.875rem;
    font-weight: 500;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
}

.saveBtn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}
```

### E. Toggle Switch
A pure CSS custom toggle.

```css
.toggle {
    position: relative;
    width: 44px;
    height: 24px;
    background: var(--admin-border);
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.toggle.active {
    background: var(--admin-accent);
}

.toggleKnob {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: transform 0.2s ease;
}

.toggle.active .toggleKnob {
    transform: translateX(20px);
}
```

---

## 4. Implementation Steps for New Project

1.  **Set up Variables**: Copy the CSS variables into your root stylesheet.
2.  **Install Dependencies**: This design relies heavily on `react-icons`.
    ```bash
    npm install react-icons
    ```
3.  **Create Basal Components**:
    *   Create a reusable `Card` component wrapping `.settingsCard`.
    *   Create a `Button` component with variants (primary/secondary).
    *   Create an `Input` component.
4.  **Adopt the Layout**: Wrap your page content in a container that handles the sidebar spacing (`margin-left: 260px`).
5.  **Use the Color Hierarchy**:
    *   **Background**: `#0a0a0b`
    *   **Surface (Card)**: `#111113`
    *   **Interactive (Input)**: `#18181b`
