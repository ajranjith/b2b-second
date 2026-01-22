"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Image as ImageIcon, LayoutGrid, Users, FileText, Upload, Newspaper } from "lucide-react";

const adminNav = [
  { label: "Dashboard", href: "/admin", icon: LayoutGrid },
  { label: "Dealers", href: "/admin/dealers", icon: Users },
  { label: "Orders", href: "/admin/orders", icon: FileText },
  { label: "Imports", href: "/admin/imports", icon: Upload },
  { label: "News", href: "/admin/news", icon: Newspaper },
  { label: "Banners", href: "/admin/banners", icon: ImageIcon },
];

export function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 border-t border-slate-200 bg-white/95 backdrop-blur z-40">
      <div className="grid grid-cols-6 gap-1 px-2 py-2">
        {adminNav.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-lg py-2 text-[11px] font-semibold ${
                isActive ? "text-blue-600" : "text-slate-500"
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
