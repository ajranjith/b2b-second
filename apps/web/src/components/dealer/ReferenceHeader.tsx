"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Settings,
  Package,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function ReferenceHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navLinks = [
    { label: "Dashboard", href: "/dealer/dashboard", icon: LayoutDashboard },
    { label: "Search Parts", href: "/dealer/search", icon: Search },
    { label: "Orders", href: "/dealer/orders", icon: Package },
    { label: "Account", href: "/dealer/account", icon: User },
  ];

  const isActive = (href: string) => pathname === href;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dealer/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    // Clear auth and redirect
    localStorage.removeItem("auth");
    router.push("/dealer/login");
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      {/* Utility Strip (Optional) */}
      <div className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 h-8 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <a
              href="tel:+441234567890"
              className="text-slate-600 hover:text-blue-600 transition-colors"
            >
              📞 Call Support: +44 1234 567890
            </a>
            <span className="text-slate-400">|</span>
            <a href="#" className="text-slate-600 hover:text-blue-600 transition-colors">
              Live Chat
            </a>
          </div>
          <div className="text-slate-600">
            <span className="font-medium">Dealer Portal Updates:</span> New features available
          </div>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 h-18 flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/dealer/dashboard" className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-slate-900">Hotbray Portal</h1>
          </Link>

          {/* Search Bar - Desktop */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-2xl items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Products"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Search
            </button>
          </form>

          {/* Right Section - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <span className="text-sm text-slate-600">
              Support: <span className="font-semibold text-blue-600">+44 1234 567890</span>
            </span>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-slate-700" />
            ) : (
              <Menu className="h-6 w-6 text-slate-700" />
            )}
          </button>
        </div>
      </div>

      {/* Secondary Nav Row */}
      <div className="bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Left: All Categories Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-full flex items-center gap-2 transition-colors">
                <Menu className="h-4 w-4" />
                <span className="font-medium">Menu</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link
                      href={link.href}
                      className={cn(
                        "flex items-center gap-3 cursor-pointer",
                        isActive(link.href) && "bg-blue-50 text-blue-600",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{link.label}</span>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dealer/account" className="flex items-center gap-3 cursor-pointer">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-3 cursor-pointer text-red-600"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Center: Horizontal Nav Links - Desktop */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors relative pb-1",
                  isActive(link.href) ? "text-blue-600" : "text-slate-600 hover:text-slate-900",
                )}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </Link>
            ))}
          </nav>

          {/* Right: Icon Group */}
          <div className="flex items-center gap-4">
            {/* Cart Icon with Badge */}
            <Link
              href="/dealer/cart"
              className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ShoppingCart className="h-6 w-6 text-slate-700" />
              {itemCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-blue-600 hover:bg-blue-600"
                >
                  {itemCount}
                </Badge>
              )}
            </Link>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <User className="h-6 w-6 text-slate-700" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/dealer/account" className="flex items-center gap-3 cursor-pointer">
                    <Settings className="h-4 w-4" />
                    <span>Account Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-3 cursor-pointer text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200">
          <div className="px-4 py-3 space-y-3">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Search Products"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-10 px-4 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="h-10 px-4 bg-blue-600 text-white rounded-lg font-medium"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>

            {/* Mobile Nav Links */}
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive(link.href)
                      ? "bg-blue-50 text-blue-600"
                      : "hover:bg-slate-50 text-slate-700",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            })}

            {/* Mobile Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
