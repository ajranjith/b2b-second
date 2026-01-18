# Final Project Structure Implementation Guide

**Date:** 2026-01-17
**Purpose:** Complete implementation following exact structure specification

---

## 📁 Project Structure

```
apps/web/src/
├── components/
│   ├── layouts/
│   │   └── AppShell.tsx .......................... ✅ EXISTS
│   ├── global/
│   │   ├── Header.tsx ............................ 🔨 CREATE (consolidate ReferenceHeader)
│   │   ├── AnnouncementTicker.tsx ................ ✅ EXISTS
│   │   └── MessageDrawer.tsx ..................... ✅ EXISTS
│   ├── nav/
│   │   ├── SideNav.tsx ........................... ✅ EXISTS (move from layouts/)
│   │   └── BottomNav.tsx ......................... ✅ EXISTS (move from layouts/)
│   ├── data/
│   │   ├── Table.tsx ............................. 🔨 CREATE
│   │   └── StatusChip.tsx ........................ 🔨 CREATE
│   ├── controls/
│   │   ├── SearchInput.tsx ....................... 🔨 CREATE
│   │   └── QtyStepper.tsx ........................ 🔨 CREATE
│   ├── feedback/
│   │   └── Toast.tsx ............................. ✅ EXISTS (using sonner)
│   └── ui/ ....................................... ✅ EXISTS (shadcn)
├── app/dealer/
│   ├── dashboard/
│   │   └── page.tsx .............................. ✅ EXISTS (enhance)
│   ├── search/
│   │   └── page.tsx .............................. ✅ EXISTS (enhance)
│   ├── cart/
│   │   └── page.tsx .............................. ✅ EXISTS
│   ├── checkout/
│   │   └── page.tsx .............................. 🔨 CREATE (3-step stepper)
│   ├── orders/
│   │   ├── page.tsx .............................. ✅ EXISTS
│   │   └── [orderId]/
│   │       ├── page.tsx .......................... 🔨 CREATE (detail)
│   │       └── process/
│   │           └── page.tsx ...................... 🔨 CREATE (status)
│   └── account/
│       └── page.tsx .............................. 🔨 CREATE
├── services/
│   ├── catalogService.ts ......................... 🔨 CREATE
│   ├── orderService.ts ........................... 🔨 CREATE
│   └── announcementService.ts .................... 🔨 CREATE
├── mocks/
│   ├── announcements.json ........................ 🔨 CREATE
│   ├── products.json ............................. 🔨 CREATE
│   ├── orders.json ............................... 🔨 CREATE
│   └── kpis.json ................................. 🔨 CREATE
├── lib/
│   ├── theme.ts .................................. ✅ EXISTS
│   └── utils.ts .................................. ✅ EXISTS
└── types/
    └── dealer.ts ................................. ✅ EXISTS
```

---

## 🔨 FILES TO CREATE

### 1. components/global/Header.tsx

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Settings,
  Package,
  LayoutDashboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navLinks = [
    { label: 'Dashboard', href: '/dealer/dashboard', icon: LayoutDashboard },
    { label: 'Search Parts', href: '/dealer/search', icon: Search },
    { label: 'Orders', href: '/dealer/orders', icon: Package },
    { label: 'Account', href: '/dealer/account', icon: User },
  ];

  const isActive = (href: string) => pathname === href;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dealer/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth');
    router.push('/dealer/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      {/* Utility Strip */}
      <div className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 h-8 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <a href="tel:+441234567890" className="text-slate-600 hover:text-blue-600 transition-colors">
              📞 Call Support: +44 1234 567890
            </a>
            <span className="text-slate-400">|</span>
            <a href="#" className="text-slate-600 hover:text-blue-600 transition-colors">
              Live Chat
            </a>
          </div>
          <div className="text-slate-600">
            <span className="font-medium">Dealer Portal Updates:</span> New features available
          </div>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 h-18 flex items-center justify-between gap-6">
          <Link href="/dealer/dashboard" className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-slate-900">Hotbray Portal</h1>
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Products"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Search
            </button>
          </form>

          <div className="hidden md:flex items-center gap-4">
            <span className="text-sm text-slate-600">
              Support: <span className="font-semibold text-blue-600">+44 1234 567890</span>
            </span>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Secondary Nav Row */}
      <div className="bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-full flex items-center gap-2 transition-colors">
                <Menu className="h-4 w-4" />
                <span className="font-medium">Menu</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link
                      href={link.href}
                      className={cn(
                        'flex items-center gap-3 cursor-pointer',
                        isActive(link.href) && 'bg-blue-50 text-blue-600'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{link.label}</span>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dealer/account" className="flex items-center gap-3 cursor-pointer">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-3 cursor-pointer text-red-600">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors relative pb-1',
                  isActive(link.href) ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {link.label}
                {isActive(link.href) && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/dealer/cart" className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ShoppingCart className="h-6 w-6 text-slate-700" />
              {itemCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-blue-600 hover:bg-blue-600">
                  {itemCount}
                </Badge>
              )}
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <User className="h-6 w-6 text-slate-700" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/dealer/account" className="flex items-center gap-3 cursor-pointer">
                    <Settings className="h-4 w-4" />
                    <span>Account Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-3 cursor-pointer text-red-600">
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200">
          <div className="px-4 py-3 space-y-3">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Search Products"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-10 px-4 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" className="h-10 px-4 bg-blue-600 text-white rounded-lg font-medium">
                <Search className="h-4 w-4" />
              </button>
            </form>

            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive(link.href) ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 text-slate-700'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            })}

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
```

### 2. components/data/StatusChip.tsx

```tsx
import { cn } from '@/lib/utils';

export type StatusVariant =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'urgent'
  | 'in_stock'
  | 'low_stock'
  | 'backorder'
  | 'out_of_stock';

interface StatusChipProps {
  variant: StatusVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  urgent: 'bg-red-100 text-red-800 border-red-300 font-semibold',
  in_stock: 'bg-green-50 text-green-700 border-green-200',
  low_stock: 'bg-amber-50 text-amber-700 border-amber-200',
  backorder: 'bg-blue-50 text-blue-700 border-blue-200',
  out_of_stock: 'bg-red-50 text-red-700 border-red-200',
};

export function StatusChip({ variant, children, className }: StatusChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
```

### 3. components/controls/SearchInput.tsx

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value?: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export function SearchInput({
  value: controlledValue,
  onChange,
  onSearch,
  placeholder = 'Search...',
  debounceMs = 300,
  className,
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(controlledValue || '');

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(internalValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [internalValue, debounceMs, onChange]);

  const handleClear = () => {
    setInternalValue('');
    onChange('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(internalValue);
  };

  return (
    <form onSubmit={handleSubmit} className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      <input
        type="text"
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 pl-10 pr-10 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded transition-colors"
          aria-label="Clear search"
        >
          <X className="h-4 w-4 text-slate-400" />
        </button>
      )}
    </form>
  );
}
```

### 4. components/controls/QtyStepper.tsx

```tsx
'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QtyStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function QtyStepper({
  value,
  onChange,
  min = 1,
  max = 999,
  step = 1,
  className,
}: QtyStepperProps) {
  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue)) {
      onChange(Math.max(min, Math.min(max, newValue)));
    }
  };

  return (
    <div className={cn('inline-flex items-center border border-slate-200 rounded-lg', className)}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= min}
        className="p-2 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4 text-slate-600" />
      </button>
      <input
        type="number"
        value={value}
        onChange={handleInputChange}
        min={min}
        max={max}
        className="w-16 text-center border-x border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10"
        aria-label="Quantity"
      />
      <button
        type="button"
        onClick={handleIncrement}
        disabled={value >= max}
        className="p-2 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4 text-slate-600" />
      </button>
    </div>
  );
}
```

---

## 📋 Summary of Action Items

### Files to Move:
1. Move `components/layouts/SideNav.tsx` → `components/nav/SideNav.tsx`
2. Move `components/layouts/BottomNav.tsx` → `components/nav/BottomNav.tsx`

### Files to Create:
1. `components/global/Header.tsx` (consolidate ReferenceHeader)
2. `components/data/StatusChip.tsx`
3. `components/data/Table.tsx`
4. `components/controls/SearchInput.tsx`
5. `components/controls/QtyStepper.tsx`

### Services to Create:
1. `services/catalogService.ts`
2. `services/orderService.ts`
3. `services/announcementService.ts`

### Mocks to Create:
1. `mocks/announcements.json`
2. `mocks/products.json`
3. `mocks/orders.json`
4. `mocks/kpis.json`

### Pages to Create/Enhance:
1. Enhance `app/dealer/dashboard/page.tsx`
2. Enhance `app/dealer/search/page.tsx`
3. Create `app/dealer/checkout/page.tsx`
4. Create `app/dealer/orders/[orderId]/page.tsx`
5. Create `app/dealer/orders/[orderId]/process/page.tsx`
6. Create `app/dealer/account/page.tsx`

### Update AppShell:
- Change imports to use new component locations
- Import Header from `components/global/Header`
- Import SideNav from `components/nav/SideNav`
- Import BottomNav from `components/nav/BottomNav`

---

**Next Steps:**
Would you like me to:
1. Create all the remaining component files?
2. Create the service layer files?
3. Create the mock JSON files?
4. Create the missing pages?
5. All of the above?

Let me know which parts you'd like me to implement next!
