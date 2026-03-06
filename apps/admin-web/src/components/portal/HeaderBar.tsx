"use client";

import Link from "next/link";
import { Bell, ShoppingCart, User } from "lucide-react";
import { SearchInput } from "@/components/portal/SearchInput";
import { useDealerCart } from "@/context/DealerCartContext";

export function HeaderBar() {
  const { items } = useDealerCart();
  const count = items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_200px] items-center gap-4">
          <Link href="/dealer/dashboard" className="text-2xl font-semibold text-slate-900">
            Hotbray Portal
          </Link>
          <div className="hidden lg:block">
            <SearchInput />
          </div>
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2"
            >
              <Bell className="h-4 w-4" />
            </button>
            <Link
              href="/dealer/cart"
              className="relative rounded-full border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2"
            >
              <ShoppingCart className="h-4 w-4" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1 text-xs font-semibold text-white">
                  {count}
                </span>
              )}
            </Link>
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2"
            >
              <User className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="mt-4 lg:hidden">
          <SearchInput size="lg" />
        </div>
      </div>
    </header>
  );
}
