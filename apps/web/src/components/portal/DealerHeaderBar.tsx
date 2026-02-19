"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDealerCart } from "@/context/DealerCartContext";
import { clearAuthToken } from "@/lib/auth";

const navLinks = [
  { label: "Dashboard", href: "/dealer/dashboard" },
  { label: "Search", href: "/dealer/search" },
  { label: "Orders", href: "/dealer/orders" },
  { label: "Cart", href: "/dealer/cart" },
  { label: "Account", href: "/dealer/account" },
];

const heroSlides = [
  "/brand/hotbray/jlr-dual-brand.webp",
  "/brand/hotbray/pexels-jan-kopiva-3399938.webp",
  "/brand/hotbray/pexels-pixabay-162553.webp",
];

export function DealerHeaderBar() {
  const router = useRouter();
  const { items } = useDealerCart();
  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, []);

  const handleLogout = () => {
    clearAuthToken();
    router.push("/dealer/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#9d7641] bg-gradient-to-b from-[#8f6a2f] to-[#735224]">
      <div className="px-6 py-3 flex items-center justify-between gap-4">
        <Link href="/dealer/dashboard" className="text-3xl font-black tracking-[0.08em] text-[#fff3d7]">
          HOTBRAY
        </Link>
        <nav className="flex items-center gap-4 text-sm font-extrabold uppercase tracking-wide text-[#ffe8b8]">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-white transition-colors">
              {link.label}
            </Link>
          ))}
          <button type="button" onClick={handleLogout} className="hover:text-white transition-colors">
            Logout
          </button>
          <Link href="/dealer/cart" className="relative inline-flex hover:text-white transition-colors">
            Cart
            {count > 0 ? (
              <span className="ml-1 inline-flex min-w-[20px] h-5 items-center justify-center rounded-full bg-[#b88b3f] px-1 text-[11px] font-black text-white">
                {count}
              </span>
            ) : null}
          </Link>
        </nav>
      </div>
      <div className="relative h-[84px] overflow-hidden border-t border-[#9d7641]/60">
        {heroSlides.map((src, index) => (
          <Image
            key={src}
            src={src}
            alt="Dealer hero"
            fill
            sizes="100vw"
            className={`object-cover transition-opacity duration-700 ${index === activeSlide ? "opacity-100" : "opacity-0"}`}
            priority={index === 0}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-[#5f431f]/70 to-transparent" />
      </div>
    </header>
  );
}
