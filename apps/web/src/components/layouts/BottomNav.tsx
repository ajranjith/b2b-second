'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Search, Package, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dealer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dealer/search', label: 'Search', icon: Search },
    { href: '/dealer/orders', label: 'Orders', icon: Package },
    { href: '/dealer/account', label: 'Account', icon: User },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 z-40 lg:hidden"
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-4 h-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-colors',
                active
                  ? 'text-blue-600'
                  : 'text-slate-400 hover:text-slate-600'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
