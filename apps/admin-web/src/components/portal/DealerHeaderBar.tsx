"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  HelpCircle,
  LayoutGrid,
  LogOut,
  Menu,
  Search,
  Settings,
  ShoppingCart,
  User,
} from "lucide-react";
import { SearchInput } from "@/components/portal/SearchInput";
import { useDealerCart } from "@/context/DealerCartContext";
import { fetchDealerBanners } from "@/lib/services/bannerApi";

const navLinks = [
  { label: "Dashboard", href: "/dealer/dashboard" },
  { label: "Search Parts", href: "/dealer/search" },
  { label: "Cart", href: "/dealer/cart" },
  { label: "Orders", href: "/dealer/orders" },
  { label: "Account", href: "/dealer/account" },
];

export function DealerHeaderBar() {
  const router = useRouter();
  const { items, clearCart } = useDealerCart();
  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const [activeSlide, setActiveSlide] = useState(0);
  const [slides, setSlides] = useState([
    { src: "/brand/hotbray/jlr-dual-brand.webp", alt: "Hotbray hero banner" },
    { src: "/brand/hotbray/pexels-jan-kopiva-3399938.webp", alt: "Hotbray parts banner" },
    { src: "/brand/hotbray/pexels-pixabay-162553.webp", alt: "Hotbray warehouse banner" },
    { src: "/brand/hotbray/zoom-air-suspension.webp", alt: "Hotbray suspension banner" },
  ]);
  const activeSlides = useMemo(() => (slides.length ? slides : []), [slides]);
  const handleLogout = () => {
    clearCart();
    router.push("/login");
  };

  useEffect(() => {
    fetchDealerBanners()
      .then((data) => {
        if (data.length) {
          setSlides(data);
        }
      })
      .catch(() => {
        // Keep defaults on error.
      });
    const handleUpdate = () => {
      fetchDealerBanners()
        .then((data) => {
          if (data.length) {
            setSlides(data);
          }
        })
        .catch(() => {
          // Keep defaults on error.
        });
    };
    window.addEventListener("banners:updated", handleUpdate);
    return () => window.removeEventListener("banners:updated", handleUpdate);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_220px] items-center gap-4">
          <Link href="/dealer/dashboard" className="text-2xl font-semibold text-slate-900">
            Hotbray Portal
          </Link>
          <div className="hidden lg:block">
            <SearchInput />
          </div>
          <div className="flex items-center justify-end gap-3">
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
              <Bell className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="mt-4 lg:hidden">
          <SearchInput size="lg" />
        </div>
      </div>
      <div className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-center">
          <div className="relative h-[70px] w-full max-w-[560px] overflow-hidden rounded-md border border-slate-200 bg-slate-100">
            {activeSlides.map((slide, index) => (
              <Image
                key={slide.src}
                src={slide.src}
                alt={slide.alt}
                fill
                sizes="(min-width: 1024px) 560px, 100vw"
                className={`object-cover transition-opacity duration-700 ${index === activeSlide ? "opacity-100" : "opacity-0"}`}
                priority={index === 0}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between gap-4">
          <button
            type="button"
            className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-900 focus-visible:outline-offset-2"
          >
            All Categories
          </button>
          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-600">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-slate-900">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-slate-500">
            <LayoutGrid className="h-4 w-4" />
            <User className="h-4 w-4" />
            <Search className="h-4 w-4" />
            <HelpCircle className="h-4 w-4" />
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
