"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Search, ShoppingCart, FileText, User, Newspaper } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dealer/dashboard", icon: LayoutGrid },
  { label: "Search Parts", href: "/dealer/search", icon: Search },
  { label: "Cart", href: "/dealer/cart", icon: ShoppingCart },
  { label: "Orders", href: "/dealer/orders", icon: FileText },
  { label: "News", href: "/dealer/news", icon: Newspaper },
  { label: "Account", href: "/dealer/account", icon: User },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:shrink-0">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
        <div className="text-xs font-semibold uppercase text-slate-400 px-3 py-2">Navigation</div>
        <nav className="mt-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
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
