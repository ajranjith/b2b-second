"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Settings,
  User,
  Menu,
  ChevronDown,
  Phone,
  Bell,
  LogOut,
  Users,
  Package,
  FileText,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@repo/ui";
import { Badge } from "@repo/ui";
import { Input } from "@repo/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui";

interface AdminHeaderProps {
  notificationCount?: number;
  adminName?: string;
  onMenuToggle?: () => void;
  onSearchSubmit?: (query: string) => void;
  className?: string;
}

/**
 * Admin Header Component
 *
 * 3-row header matching dealer portal design:
 * Row 1: Utility strip with support links
 * Row 2: Main header with logo, search, hotline
 * Row 3: Secondary nav with black menu button + horizontal links + icons
 */
export function AdminHeader({
  notificationCount = 0,
  adminName = "Admin User",
  onMenuToggle,
  onSearchSubmit,
  className,
}: AdminHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (onSearchSubmit) {
        onSearchSubmit(searchQuery);
      } else {
        router.push(`/admin/search?q=${encodeURIComponent(searchQuery)}`);
      }
    }
  };

  const handleLogout = () => {
    router.push("/admin/login");
  };

  const handleMenuToggle = () => {
    onMenuToggle?.();
  };

  const navLinks = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Orders", href: "/admin/orders", icon: Package },
    { label: "Dealers", href: "/admin/dealers", icon: Users },
    { label: "Users", href: "/admin/users", icon: User },
    { label: "Templates", href: "/admin/templates", icon: FileText },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className={cn("bg-white border-b border-slate-200", className)}>
      {/* Row 1: Utility Strip */}
      <div className="bg-slate-50 border-b border-slate-200 h-8">
        <div className="max-w-[1440px] mx-auto px-6 h-full flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/support"
              className="text-slate-600 hover:text-blue-600 transition-colors"
            >
              Support
            </Link>
            <Link
              href="/admin/docs"
              className="text-slate-600 hover:text-blue-600 transition-colors"
            >
              Documentation
            </Link>
            <a
              href="tel:+441234567890"
              className="flex items-center gap-1 text-slate-600 hover:text-blue-600 transition-colors"
            >
              <Phone className="w-3 h-3" />
              <span>Call Support</span>
            </a>
          </div>
          <div className="hidden md:block text-slate-600 text-center">
            <span className="font-medium">Admin Portal</span> - Manage dealers, orders, and system
            settings
          </div>
          <div className="text-slate-600">
            System Status:{" "}
            <span className="text-green-600 font-medium">All Systems Operational</span>
          </div>
        </div>
      </div>

      {/* Row 2: Main Header */}
      <div className="h-18 border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto px-6 h-full flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/admin/dashboard" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">HB</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 text-base leading-tight">Admin Portal</span>
              <span className="text-[10px] text-slate-500 leading-tight">Management Console</span>
            </div>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search orders, dealers, users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-4 pr-24 rounded-lg border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <Button
                type="submit"
                className="absolute right-1 top-1 h-9 px-6 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </form>

          {/* Hotline Section */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-600">Support Hotline</span>
              <a
                href="tel:+441234567890"
                className="text-sm font-semibold text-slate-900 hover:text-blue-600"
              >
                +44 1234 567 890
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Secondary Nav */}
      <div className="h-14 bg-white">
        <div className="max-w-[1440px] mx-auto px-6 h-full flex items-center justify-between">
          {/* Left: Black Pill Menu Button */}
          <Button
            onClick={handleMenuToggle}
            className="bg-slate-900 hover:bg-slate-800 text-white h-10 px-4 rounded-full gap-2"
          >
            <Menu className="w-4 h-4" />
            <span className="hidden sm:inline">All Sections</span>
            <ChevronDown className="w-4 h-4" />
          </Button>

          {/* Center: Horizontal Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-lg",
                    "border-b-2 border-transparent",
                    isActive(link.href)
                      ? "text-blue-600 border-blue-600 bg-blue-50"
                      : "text-slate-700 hover:text-blue-600 hover:bg-slate-50",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: Icons */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center bg-red-600 text-white text-xs px-1">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </Badge>
              )}
            </Button>

            {/* Settings */}
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 h-10 px-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden lg:inline text-sm font-medium">{adminName}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{adminName}</p>
                  <p className="text-xs text-slate-500">Administrator</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/profile" className="cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings" className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
