"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  ChevronDown,
  Phone,
  HeartIcon,
  LogOut,
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

interface ReferenceHeaderProps {
  cartItemCount?: number;
  dealerName?: string;
  onCartClick?: () => void;
  onMenuToggle?: () => void;
  onSearchSubmit?: (query: string) => void;
  className?: string;
}

/**
 * Reference-Style Header Component
 *
 * 2-row header matching reference video:
 * Row 1 (Optional): Utility strip with support links
 * Row 2: Main header with logo, search, icons
 * Row 3: Secondary nav with black category button + horizontal links + icons
 */
export function ReferenceHeader({
  cartItemCount = 0,
  dealerName = "Dealer Portal",
  onCartClick,
  onMenuToggle,
  onSearchSubmit,
  className,
}: ReferenceHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (onSearchSubmit) {
        onSearchSubmit(searchQuery);
      } else {
        router.push(`/dealer/search?q=${encodeURIComponent(searchQuery)}`);
      }
    }
  };

  const handleLogout = () => {
    router.push("/dealer/login");
  };

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
    onMenuToggle?.();
  };

  const navLinks = [
    { label: "Dashboard", href: "/dealer/dashboard" },
    { label: "Search Parts", href: "/dealer/search" },
    { label: "Orders", href: "/dealer/orders" },
    { label: "Account", href: "/dealer/account" },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className={cn("bg-white border-b border-slate-200", className)}>
      {/* Row 1: Utility Strip (Optional) */}
      <div className="bg-slate-50 border-b border-slate-200 h-8">
        <div className="max-w-[1440px] mx-auto px-6 h-full flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <Link
              href="/dealer/support"
              className="text-slate-600 hover:text-blue-600 transition-colors"
            >
              Support
            </Link>
            <Link
              href="/dealer/support"
              className="text-slate-600 hover:text-blue-600 transition-colors"
            >
              Live Chat
            </Link>
            <a
              href="tel:+441234567890"
              className="flex items-center gap-1 text-slate-600 hover:text-blue-600 transition-colors"
            >
              <Phone className="w-3 h-3" />
              Call Support
            </a>
          </div>
          <div className="hidden md:block text-slate-600">
            Dealer Portal Updates - Check our latest stock additions
          </div>
          <div className="text-slate-600">Free shipping on orders over £500</div>
        </div>
      </div>

      {/* Row 2: Main Header */}
      <div className="h-18 border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto px-6 h-full flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/dealer/dashboard" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">HB</span>
            </div>
            <span className="hidden md:block text-xl font-bold text-slate-900">Dealer Portal</span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl">
            <div className="relative">
              <Input
                type="search"
                placeholder="Search Products"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-4 pr-24 border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-1 top-1 h-9 bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                <Search className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Search</span>
              </Button>
            </div>
          </form>

          {/* Hotline/Support (Optional) */}
          <div className="hidden lg:flex items-center gap-2 text-slate-700">
            <Phone className="w-5 h-5 text-blue-600" />
            <div className="text-sm">
              <div className="font-semibold">Hotline</div>
              <div className="text-slate-600">+44 123 456 7890</div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Secondary Nav */}
      <div className="h-14 bg-white">
        <div className="max-w-[1440px] mx-auto px-6 h-full flex items-center justify-between">
          {/* Left: Black Category Button */}
          <Button
            variant="default"
            onClick={handleMenuToggle}
            className="bg-slate-900 hover:bg-slate-800 text-white h-10 px-4 rounded-full gap-2"
          >
            <Menu className="w-4 h-4" />
            <span className="hidden sm:inline">All Categories</span>
            <ChevronDown className="w-4 h-4" />
          </Button>

          {/* Center: Horizontal Nav Links */}
          <nav className="hidden md:flex items-center gap-6 mx-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors py-2 border-b-2",
                  isActive(link.href)
                    ? "text-blue-600 border-blue-600"
                    : "text-slate-700 border-transparent hover:text-blue-600",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right: Icon Group */}
          <div className="flex items-center gap-3">
            {/* Heart Icon (Optional - can remove for dealer portal) */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex relative text-slate-700 hover:text-blue-600"
            >
              <HeartIcon className="w-5 h-5" />
            </Button>

            {/* Cart Icon with Badge */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onCartClick || (() => router.push("/dealer/cart"))}
              className="relative text-slate-700 hover:text-blue-600"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
                >
                  {cartItemCount > 99 ? "99+" : cartItemCount}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-700 hover:text-blue-600">
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm font-semibold">{dealerName}</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dealer/account")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dealer/orders")}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  <span>My Orders</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
