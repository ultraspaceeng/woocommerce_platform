# Global UI/UX Design System

This document provides a comprehensive guide to the Royal-Commerce global styling system defined in `app/global.css`.

---

## Theme Architecture

The design system uses CSS Custom Properties (variables) that automatically adapt to **Light** and **Dark** modes.

### Theme Switching
- **Default**: Light theme
- **System Preference**: Uses `prefers-color-scheme` media query
- **Manual Override**: Set `data-theme="light"` or `data-theme="dark"` on `<html>`

---

## Color Palette

### Background Colors

| Variable | Light Mode | Dark Mode | Usage |
|----------|------------|-----------|-------|
| `--color-bg-primary` | `#ffffff` | `#0a0a0a` | Page background |
| `--color-bg-secondary` | `#f8f9fa` | `#141414` | Cards, sections |
| `--color-bg-tertiary` | `#f1f3f5` | `#1a1a1a` | Nested containers |

### Text Colors

| Variable | Light Mode | Dark Mode | Usage |
|----------|------------|-----------|-------|
| `--color-text-primary` | `#0a0a0a` | `#fafafa` | Headings, body |
| `--color-text-secondary` | `#495057` | `#a1a1aa` | Subtitles, descriptions |
| `--color-text-muted` | `#868e96` | `#71717a` | Placeholders, hints |

### Border Colors

| Variable | Light Mode | Dark Mode |
|----------|------------|-----------|
| `--color-border` | `#dee2e6` | `#27272a` |
| `--color-border-light` | `#e9ecef` | `#1f1f23` |

### Accent Colors (Royal Blue)

| Variable | Value | Usage |
|----------|-------|-------|
| `--color-accent` | `#4169E1` | Primary buttons, links |
| `--color-accent-hover` | `#3457c9` | Hover states |
| `--color-accent-light` | `rgba(65, 105, 225, 0.1)` | Highlights, badges |

### Status Colors

| Variable | Value | Usage |
|----------|-------|-------|
| `--color-success` | `#22c55e` | Success messages, badges |
| `--color-warning` | `#eab308` | Warnings, caution |
| `--color-error` | `#ef4444` | Errors, destructive actions |

---

## Typography

**Font Family**: `'Bricolage Grotesque'` (Google Fonts)

```css
font-family: var(--font-primary);
```

Fallback: `system-ui, -apple-system, sans-serif`

---

## Spacing Scale

| Variable | Value |
|----------|-------|
| `--space-xs` | `0.25rem` (4px) |
| `--space-sm` | `0.5rem` (8px) |
| `--space-md` | `1rem` (16px) |
| `--space-lg` | `1.5rem` (24px) |
| `--space-xl` | `2rem` (32px) |
| `--space-2xl` | `3rem` (48px) |
| `--space-3xl` | `4rem` (64px) |

---

## Border Radius

| Variable | Value |
|----------|-------|
| `--radius-sm` | `4px` |
| `--radius-md` | `8px` |
| `--radius-lg` | `12px` |
| `--radius-xl` | `16px` |
| `--radius-full` | `9999px` (pill) |

---

## Shadows

| Variable | Light Mode | Dark Mode |
|----------|------------|-----------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | `0 1px 2px rgba(0,0,0,0.3)` |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.07)` | `0 4px 6px rgba(0,0,0,0.4)` |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | `0 10px 15px rgba(0,0,0,0.5)` |

---

## Transitions

| Variable | Duration |
|----------|----------|
| `--transition-fast` | `150ms ease` |
| `--transition-base` | `250ms ease` |
| `--transition-slow` | `350ms ease` |

---

## Layout Constants

| Variable | Value |
|----------|-------|
| `--header-height` | `64px` |
| `--sidebar-width` | `260px` |
| `--container-max` | `1280px` |

---

## Component Styling Examples

### Cards
```css
.card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  box-shadow: var(--shadow-md);
}
```

### Buttons
```css
.btn-primary {
  background: var(--color-accent);
  color: white;
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-lg);
  transition: background var(--transition-fast);
}
.btn-primary:hover {
  background: var(--color-accent-hover);
}
```

### Inputs
```css
.input {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-md);
}
.input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-light);
}
```

### Status Badges
```css
.badge-success {
  background: rgba(34, 197, 94, 0.1);
  color: var(--color-success);
}
.badge-error {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
}
```

---

## Utility Classes

| Class | Description |
|-------|-------------|
| `.container` | Max-width centered container |
| `.sr-only` | Screen reader only (accessibility) |

---

## Base Resets Applied

- `box-sizing: border-box` on all elements
- Default margins/padding reset
- Smooth scroll behavior
- Anti-aliased font rendering
- Themed scrollbar styling
- Focus-visible outlines using accent color
- Selection highlighting with accent color
