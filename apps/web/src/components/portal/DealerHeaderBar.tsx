'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  ChevronDown,
  Cog,
  LayoutGrid,
  LogOut,
  Menu,
  Package,
  Search,
  Settings,
  ShoppingCart,
  User,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { SearchInput } from '@/components/portal/SearchInput';
import { useDealerCart } from '@/context/DealerCartContext';

const navLinks = [
  { label: 'Dashboard', href: '/dealer/dashboard', icon: LayoutGrid },
  { label: 'Search Parts', href: '/dealer/search', icon: Search },
  { label: 'Orders', href: '/dealer/orders', icon: Package },
  { label: 'Account', href: '/dealer/account', icon: User },
];

export function DealerHeaderBar() {
  const { items } = useDealerCart();
  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-slate-900 shadow-xl shadow-black/10">
      {/* Top utility bar */}
      <div className="border-b border-slate-800 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 py-1.5 flex items-center justify-between text-xs text-slate-400">
          <span className="hidden md:block">Welcome to Hotbray Dealer Portal</span>
          <div className="flex items-center gap-4 ml-auto">
            <Link href="/dealer/account" className="hover:text-amber-400 transition-colors inline-flex items-center gap-1">
              <User className="h-3 w-3" /> My Account
            </Link>
            <span className="text-slate-700">|</span>
            <Link href="/login" className="hover:text-amber-400 transition-colors inline-flex items-center gap-1">
              <LogOut className="h-3 w-3" /> Sign Out
            </Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dealer/dashboard" className="flex items-center gap-3 group flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span className="text-slate-900 font-bold text-lg">H</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-lg font-bold text-white tracking-tight">HOTBRAY</div>
              <div className="text-[9px] text-amber-400/70 uppercase tracking-[0.2em] font-semibold">Dealer Portal</div>
            </div>
          </Link>

          {/* Search bar (center) */}
          <div className="hidden lg:block flex-1 max-w-md mx-8">
            <SearchInput />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/dealer/cart"
              className="relative flex items-center justify-center w-10 h-10 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-slate-900">
                  {count}
                </span>
              )}
            </Link>
            <button
              type="button"
              className="flex items-center justify-center w-10 h-10 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <Bell className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="flex items-center justify-center w-10 h-10 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <Settings className="h-5 w-5" />
            </button>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation bar */}
      <div className="border-t border-slate-800 bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="hidden lg:flex items-center justify-between h-11">
            <nav className="flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors duration-200
                      ${isActive
                        ? 'text-amber-400'
                        : 'text-slate-400 hover:text-white'
                      }
                      after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-0.5 after:bg-amber-400 after:transition-all after:duration-300
                      ${isActive ? 'after:w-2/3' : 'after:w-0 hover:after:w-1/3'}
                    `}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <div className="flex items-center gap-3">
              <Link
                href="/dealer/backorders"
                className={`text-xs font-semibold px-3 py-1 rounded-full transition-all duration-200 ${
                  pathname.startsWith('/dealer/backorders')
                    ? 'bg-amber-400 text-slate-900'
                    : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                }`}
              >
                Backorders
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900/98 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 py-4 space-y-1">
            <div className="mb-4">
              <SearchInput size="lg" />
            </div>
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                    isActive
                      ? 'text-amber-400 bg-slate-800'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/dealer/backorders"
              className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-400 hover:bg-slate-800/50 rounded-xl transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Package className="h-4 w-4" />
              Backorders
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
