"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Search, ShoppingCart, FileText, User, Newspaper } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dealer/dashboard", icon: LayoutGrid },
  { label: "Search", href: "/dealer/search", icon: Search },
  { label: "Cart", href: "/dealer/cart", icon: ShoppingCart },
  { label: "Orders", href: "/dealer/orders", icon: FileText },
  { label: "News", href: "/dealer/news", icon: Newspaper },
  { label: "Account", href: "/dealer/account", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 border-t border-[#9d7641] bg-gradient-to-b from-[#8f6a2f] to-[#735224] backdrop-blur z-40">
      <div className="grid grid-cols-6 gap-1 px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-lg py-2 text-[11px] font-bold ${
                isActive ? "text-white" : "text-[#ffe8b8]"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
