# Styling Rules

## CSS Separation - CRITICAL

**All styling MUST be separated from component logic.**

### ❌ Never Do This

```tsx
// Inline sx props - FORBIDDEN
<Box sx={{ display: 'flex', gap: 2, p: 3 }}>

// Inline style attributes - FORBIDDEN  
<div style={{ color: 'red' }}>

// MUI responsive objects - FORBIDDEN
<Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
```

### ✅ Always Do This

```tsx
// Use CSS Module classes
<Box className={styles.container}>
<div className={styles.wrapper}>
```

## CSS Modules

1. **Create a `.module.css` file for each component**
   - File naming: `ComponentName.module.css` alongside `ComponentName.tsx`

2. **Class naming conventions**
   - Use camelCase: `.containerWrapper`, `.searchButton`
   - State classes: `.isActive`, `.isDisabled`, `.hasError`

3. **Conditional classes with clsx**
   ```tsx
   import clsx from 'clsx';
   <div className={clsx(styles.item, isActive && styles.isActive)} />
   ```

## Responsive Design

Use CSS media queries, NOT MUI responsive syntax:

```css
/* Mobile-first base styles */
.button {
  padding: 8px 16px;
  font-size: 0.875rem;
}

/* Tablet and up */
@media (min-width: 600px) {
  .button {
    padding: 12px 24px;
    font-size: 1rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .button {
    padding: 16px 32px;
  }
}
```

## CSS Custom Properties

Define variables in `globals.css`:

```css
:root {
  /* Colors */
  --color-primary: #1976d2;
  --color-error: #d32f2f;
  --color-text: #212121;
  --color-text-secondary: #757575;
  --color-background: #ffffff;
  --color-border: #e0e0e0;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
}
```

## CSS Property Order

Organize properties consistently:

```css
.element {
  /* Positioning */
  position: relative;
  top: 0;
  z-index: 1;
  
  /* Box Model */
  display: flex;
  width: 100%;
  padding: var(--spacing-md);
  margin: 0;
  
  /* Typography */
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  
  /* Visual */
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  
  /* Misc */
  cursor: pointer;
  transition: all 0.2s ease;
}
```

## RTL Support (Hebrew)

Use logical properties:

```css
/* ❌ Avoid */
margin-left: 16px;
padding-right: 8px;
text-align: left;

/* ✅ Use */
margin-inline-start: 16px;
padding-inline-end: 8px;
text-align: start;
```

