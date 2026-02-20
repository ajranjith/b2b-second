'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlertTriangle, LayoutGrid, Package, Search, ShoppingCart, FileText, User } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/dealer/dashboard', icon: LayoutGrid },
  { label: 'Search Parts', href: '/dealer/search', icon: Search },
  { label: 'Cart', href: '/dealer/cart', icon: ShoppingCart },
  { label: 'Orders', href: '/dealer/orders', icon: FileText },
  { label: 'Backorders', href: '/dealer/backorders', icon: AlertTriangle },
  { label: 'Account', href: '/dealer/account', icon: User },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:shrink-0">
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl p-4">
        <div className="text-[10px] font-bold uppercase text-amber-400/60 tracking-widest px-3 py-2">
          Navigation
        </div>
        <nav className="mt-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
