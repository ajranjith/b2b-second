# Component Architecture & Modernization Update (Jan 13, 2026)

This update introduces a modernized frontend architecture for the `web` application, focusing on scalability, developer experience, and runtime flexibility.

## 🚀 Key Modernizations

### 1. Tailwind CSS v4 (CSS-First)
The project has been migrated to **Tailwind CSS v4**. 
- **No JS Config**: `tailwind.config.ts` has been removed. All configuration (colors, spacing, theme) is now handled directly in `src/app/globals.css` using the `@theme` directive.
- **Improved Performance**: Uses the lightning-fast `@tailwindcss/postcss` engine.
- **Native CSS Variables**: All design tokens are exposed as standard CSS variables.

### 2. Centralized Component Architecture
We've implemented a "Barrel" system to simplify imports and provide a single source of truth for UI elements.
- **Path Aliases**: Defined in `tsconfig.json`. Use `@/components`, `@/ui`, `@/dealer`, etc.
- **Master Barrel**: `src/components/index.ts` exports all modules, allowing for clean imports:
  ```typescript
  import { Button, ProductCard, DealerTable } from '@/components'
  ```

## 🧩 Dynamic Component System
For advanced scenarios where components need to be swapped at runtime or loaded based on backend configuration:

### 1. Component Registry (`src/components/registry.ts`)
A runtime mapping system that allows looking up components by string aliases (e.g., `dealer.product-card`). Supports **Lazy Loading** out of the box.

### 2. Component Manifest (`src/config/components.json`)
A static JSON file that maps aliases to physical paths and versions. This allows side-loading or swapping implementations without code changes.

### 3. Dynamic Loader (`src/lib/component-loader.ts`)
A set of utilities for route-based component resolution.
- **`DynamicComponent`**: A React component that wraps registry lookups with `<Suspense>` and handles fallbacks.

## 🛠 Infrastructure Updates

### API Prisma Connection Fix
Refactored `apps/api` to use the shared `db` package's Prisma instance. This resolves the `PrismaClientInitializationError` caused by multiple client instantiations and schema path mismatches.

### Unified Service Management
Path aliases and configuration have been standardized across the monorepo to ensure consistent development behavior.
