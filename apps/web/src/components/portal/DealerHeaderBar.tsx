'use client';

import Link from 'next/link';
import { Bell, HelpCircle, LayoutGrid, Menu, Search, Settings, ShoppingCart, User } from 'lucide-react';
import { SearchInput } from '@/components/portal/SearchInput';
import { useDealerCart } from '@/context/DealerCartContext';

const navLinks = [
  { label: 'Dashboard', href: '/dealer/dashboard' },
  { label: 'Search Parts', href: '/dealer/search' },
  { label: 'Cart', href: '/dealer/cart' },
  { label: 'Orders', href: '/dealer/orders' },
  { label: 'Account', href: '/dealer/account' },
];

export function DealerHeaderBar() {
  const { items } = useDealerCart();
  const count = items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_220px] items-center gap-4">
          <Link href="/dealer/dashboard" className="text-2xl font-semibold text-slate-900">
            Hotbray Portal
          </Link>
          <div className="hidden lg:block">
            <SearchInput />
          </div>
          <div className="flex items-center justify-end gap-3">
            <Link
              href="/dealer/cart"
              className="relative rounded-full border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2"
            >
              <ShoppingCart className="h-4 w-4" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1 text-xs font-semibold text-white">
                  {count}
                </span>
              )}
            </Link>
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2"
            >
              <Bell className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="mt-4 lg:hidden">
          <SearchInput size="lg" />
        </div>
      </div>
      <div className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between gap-4">
          <button
            type="button"
            className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-900 focus-visible:outline-offset-2"
          >
            All Categories
          </button>
          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-600">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-slate-900">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-slate-500">
            <LayoutGrid className="h-4 w-4" />
            <User className="h-4 w-4" />
            <Search className="h-4 w-4" />
            <HelpCircle className="h-4 w-4" />
          </div>
        </div>
      </div>
    </header>
  );
}
