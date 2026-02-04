'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Users, Package, FileText, Upload, Settings, Shield } from 'lucide-react';

const adminNav = [
  { label: 'Dashboard', href: '/admin', icon: LayoutGrid },
  { label: 'Dealers', href: '/admin/dealers', icon: Users },
  { label: 'Users', href: '/admin/users', icon: Shield },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Orders', href: '/admin/orders', icon: FileText },
  { label: 'Imports', href: '/admin/imports', icon: Upload },
  { label: 'Templates', href: '/admin/templates', icon: Upload },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:shrink-0">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
        <div className="text-xs font-semibold uppercase text-slate-400 px-3 py-2">Admin</div>
        <nav className="mt-2 space-y-1">
          {adminNav.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
