# Project Overview

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: MUI (Material-UI) v7
- **Styling**: CSS Modules + CSS Custom Properties
- **Auth**: Clerk
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Language**: TypeScript (strict mode)

## Project Structure

```
src/
  app/                    # Next.js App Router pages
    page.tsx
    page.module.css
    layout.tsx
    globals.css
    api/                  # API routes
    dashboard/
      page.tsx
      page.module.css
  components/             # Reusable components
    Header/
    VideoPlayer/
    VideoList/
    SearchBox/
  hooks/                  # Custom React hooks
    useSearchHistory.ts
    useSkippedVideos.ts
  db/                     # Database schema and queries
    index.ts
    schema.ts
  types/                  # TypeScript type definitions
    youtube.ts
  lib/                    # Utility functions
```

## Key Patterns

### API Routes
- Located in `app/api/`
- Use Route Handlers (Next.js 13+ pattern)
- Return `NextResponse.json()`

### Database
- Drizzle ORM with Neon PostgreSQL
- Schema defined in `src/db/schema.ts`
- Database instance in `src/db/index.ts`

### Authentication
- Clerk for auth
- Protected routes use Clerk middleware
- Access user with `useUser()` hook or `auth()` server function

### State Management
- React hooks for local state
- Custom hooks for shared logic
- No global state library needed

## Language

- Primary UI language: Hebrew (RTL)
- Code comments: English
- Variable/function names: English

