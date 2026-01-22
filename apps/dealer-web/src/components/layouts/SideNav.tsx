"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Search, Package, User, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface SideNavProps {
  onNavigate?: () => void;
}

export function SideNav({ onNavigate }: SideNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: "/dealer/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dealer/search", label: "Search Parts", icon: Search },
    { href: "/dealer/orders", label: "Orders", icon: Package },
    { href: "/dealer/account", label: "Account", icon: User },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleLogout = () => {
    localStorage.removeItem("auth");
    router.push("/dealer/login");
  };

  return (
    <nav className="py-4" aria-label="Main navigation">
      <div className="space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600 -ml-[1px] pl-[11px]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-slate-200 px-3 space-y-1">
        <Link
          href="/dealer/account"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          <span>Settings</span>
        </Link>

        <button
          onClick={() => {
            onNavigate?.();
            handleLogout();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}
