# Admin UI Design System

This document outlines the design system and theming guidelines for the Admin interface.

## Theme Architecture

The Admin UI uses a CSS Variable-based theming system that supports both Light and Dark modes. The theme is controlled by the `data-theme` attribute on the root element.

### Color Palette

The color system relies on functional variables rather than hardcoded hex values.

| Variable | Description | Light Mode | Dark Mode |
|----------|-------------|------------|-----------|
| `--admin-bg` | Main page background | `#ffffff` | `#0a0a0b` |
| `--admin-bg-card` | Card/Container background | `#ffffff` | `#111113` |
| `--admin-bg-hover` | Hover state background | `#f4f4f5` | `#18181b` |
| `--admin-bg-active` | Active state background | `#e4e4e7` | `#1f1f23` |
| `--admin-border` | Default border color | `#e4e4e7` | `#27272a` |
| `--admin-border-light` | Lighter border (dividers) | `#d4d4d8` | `#3f3f46` |
| `--admin-text` | Primary text color | `#09090b` | `#fafafa` |
| `--admin-text-secondary` | Secondary text color | `#52525b` | `#a1a1aa` |
| `--admin-text-muted` | Muted/Disabled text | `#71717a` | `#71717a` |
| `--admin-accent` | Primary accent color | `#4f46e5` | `#6366f1` |

### Shared Components

Shared UI components (like Inputs, Buttons) imported from `@/components/ui` rely on global variables (`--color-bg-primary`, etc.). These are automatically mapped to Admin Theme variables within the `.adminLayout` wrapper to ensure consistency.

**Mapping:**
- `var(--color-bg-primary)` → `var(--admin-bg)`
- `var(--color-text-primary)` → `var(--admin-text)`
- `var(--color-border)` → `var(--admin-border)`

## Usage Guidelines

### 1. New Pages
When creating new admin pages, wrap content in the standard layout structure and use CSS modules.

```tsx
// page.module.css
.page {
  background-color: var(--admin-bg);
  color: var(--admin-text);
}

.card {
  background-color: var(--admin-bg-card);
  border: 1px solid var(--admin-border);
}
```

### 2. Forms & Inputs
Use the shared `Input`, `Select`, and `Button` components. They will automatically adapt to the admin theme.

```tsx
import { Input } from '@/components/ui/input';

<Input label="Product Name" placeholder="Enter name" />
```

### 3. Status Badges
Use the semantic background variables for status badges:

```css
.success {
  background: var(--admin-success-bg);
  color: var(--admin-success-text);
}
.error {
  background: var(--admin-error-bg);
  color: var(--admin-error-text);
}
```

## Troubleshooting

- **Input is black in light mode?**
  Ensure the parent container has the `.adminLayout` class, or check that `admin.css` is correctly imported. The global override for shared variables relies on the `.adminLayout` scope.

- **Theme not switching?**
  Verify the `data-theme` attribute is toggling on the `<html>` or `<body>` tag.
