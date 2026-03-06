"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, HelpCircle, User, LogOut, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface DealerHeaderProps {
  cartItemCount?: number;
  dealerName?: string;
  onCartClick?: () => void;
  onSearchSubmit?: (query: string) => void;
  className?: string;
}

/**
 * Dealer Header Component
 *
 * Main header for the Dealer Portal with:
 * - Logo + branding
 * - Global search
 * - Help/Contact
 * - Cart badge
 * - User menu
 */
export function DealerHeader({
  cartItemCount = 0,
  dealerName = "Dealer Portal",
  onCartClick,
  onSearchSubmit,
  className,
}: DealerHeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

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
    // TODO: Implement proper logout
    router.push("/dealer/login");
  };

  return (
    <div className={cn("h-full flex items-center justify-between px-6 gap-4", className)}>
      {/* Left: Logo + Branding */}
      <div className="flex items-center gap-3">
        <Link
          href="/dealer/dashboard"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">HB</span>
          </div>
          <span className="hidden md:block text-lg font-semibold text-slate-900">
            Dealer Portal
          </span>
        </Link>
      </div>

      {/* Center: Global Search */}
      <div className="flex-1 max-w-md hidden md:block">
        <form onSubmit={handleSearchSubmit}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Search parts (Part No / JagAlt / Description)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-10 bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>
        </form>
      </div>

      {/* Right: Actions + User Menu */}
      <div className="flex items-center gap-2">
        {/* Help/Contact */}
        <Button
          variant="ghost"
          size="sm"
          className="hidden lg:flex items-center gap-2"
          onClick={() => router.push("/dealer/contact")}
        >
          <HelpCircle className="w-4 h-4" />
          <span className="hidden xl:inline">Help</span>
        </Button>

        {/* Cart Badge */}
        <Button
          variant="ghost"
          size="sm"
          className="relative"
          onClick={onCartClick || (() => router.push("/dealer/cart"))}
        >
          <ShoppingCart className="w-5 h-5" />
          {cartItemCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {cartItemCount > 99 ? "99+" : cartItemCount}
            </Badge>
          )}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden lg:inline text-sm">{dealerName}</span>
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

        {/* Mobile Menu (Optional) */}
        <Button variant="ghost" size="sm" className="lg:hidden">
          <Menu className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
