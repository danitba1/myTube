# Component Rules

## File Structure

Each component should be in its own folder:

```
components/
  Header/
    Header.tsx        # Component logic
    Header.module.css # Component styles
    index.ts          # Re-export
  VideoPlayer/
    VideoPlayer.tsx
    VideoPlayer.module.css
    index.ts
```

## Component File Organization

```tsx
// 1. Imports - React, libraries, types, styles (in order)
import { useState, useCallback } from 'react';
import { Box, Button } from '@mui/material';
import { SearchIcon } from '@mui/icons-material';
import type { Video } from '@/types/youtube';
import styles from './ComponentName.module.css';

// 2. Types/Interfaces
interface ComponentProps {
  title: string;
  isLoading?: boolean;
  onAction: () => void;
}

// 3. Component function
export default function ComponentName({ title, isLoading, onAction }: ComponentProps) {
  // 4. Hooks (state, refs, custom hooks)
  const [isOpen, setIsOpen] = useState(false);
  
  // 5. Derived state / computations
  const displayTitle = title.toUpperCase();
  
  // 6. Event handlers
  const handleClick = useCallback(() => {
    setIsOpen(true);
    onAction();
  }, [onAction]);
  
  // 7. Effects (if any)
  
  // 8. Early returns for loading/error states
  if (isLoading) {
    return <div className={styles.skeleton} />;
  }
  
  // 9. Main render
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{displayTitle}</h1>
      <Button className={styles.button} onClick={handleClick}>
        Action
      </Button>
    </div>
  );
}
```

## Naming Conventions

### Files
- Components: `PascalCase.tsx` (e.g., `VideoPlayer.tsx`)
- CSS Modules: `PascalCase.module.css` (e.g., `VideoPlayer.module.css`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useSearchHistory.ts`)
- Utilities: `camelCase.ts` (e.g., `formatters.ts`)

### Props
- Descriptive names: `onVideoSelect` not `onSelect`
- Booleans: `isLoading`, `hasError`, `canSubmit`
- Handlers: prefix with `on` (e.g., `onClick`, `onSearch`)
- Optional props: use `?` suffix in interface

### CSS Classes
- camelCase: `.videoContainer`, `.searchInput`
- States: `.isActive`, `.isDisabled`, `.hasError`
- Variants: `.buttonPrimary`, `.buttonSecondary`

## Component Size

- Keep components under 150 lines
- If larger, split into sub-components
- Extract complex logic into custom hooks

## Performance

```tsx
// ✅ Memoize handlers passed to children
const handleClick = useCallback(() => {
  doSomething();
}, [dependency]);

// ✅ Memoize expensive computations
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.name.localeCompare(b.name));
}, [items]);

// ❌ Don't create objects/arrays in render
<Component style={{ color: 'red' }} />  // Creates new object every render
<Component items={[1, 2, 3]} />         // Creates new array every render
```

## Accessibility

- Always include proper ARIA labels
- Ensure keyboard navigation works
- Use semantic HTML elements (`<button>`, `<nav>`, `<main>`)
- Provide alt text for images

