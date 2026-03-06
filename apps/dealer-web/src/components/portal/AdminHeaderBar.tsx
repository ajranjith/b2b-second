"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Mail, Phone } from "lucide-react";
import { removeAuthToken } from "@/lib/auth";
import { fetchAdminBanners } from "@/lib/services/bannerApi";

const navLinks = [
  { label: "Dashboard", href: "/admin" },
  { label: "Dealers", href: "/admin/dealers" },
  { label: "Admin Users", href: "/admin/users" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Imports", href: "/admin/imports" },
  { label: "News Articles", href: "/admin/news" },
];

const defaultSlides = [
  { src: "/brand/hotbray/jlr-dual-brand.webp", alt: "Hotbray hero banner" },
  { src: "/brand/hotbray/pexels-jan-kopiva-3399938.webp", alt: "Hotbray parts banner" },
  { src: "/brand/hotbray/pexels-pixabay-162553.webp", alt: "Hotbray warehouse banner" },
  { src: "/brand/hotbray/zoom-air-suspension.webp", alt: "Hotbray suspension banner" },
];

export function AdminHeaderBar() {
  const router = useRouter();
  const [activeSlide, setActiveSlide] = useState(0);
  const [slides, setSlides] = useState(defaultSlides);
  const slideCount = slides.length || defaultSlides.length;
  const activeSlides = useMemo(() => (slides.length ? slides : defaultSlides), [slides]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slideCount);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [slideCount]);

  useEffect(() => {
    fetchAdminBanners()
      .then((data) => {
        if (data.length) {
          setSlides(data);
        }
      })
      .catch(() => {
        // Keep defaults on error.
      });
    const handleUpdate = () => {
      fetchAdminBanners()
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

  const handleLogout = () => {
    removeAuthToken();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr_320px] items-center gap-4">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-2">
              <Image
                src="/brand/hotbray/hotbray-logo-inverse.svg"
                alt="Hotbray logo"
                width={120}
                height={32}
                priority
              />
            </span>
          </Link>

          <div className="flex justify-center">
            <div className="relative h-[86px] w-full max-w-[520px] overflow-hidden rounded-md border border-slate-200 bg-slate-100">
              {activeSlides.map((slide, index) => (
                <Image
                  key={slide.src}
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  sizes="(min-width: 1024px) 520px, 100vw"
                  className={`object-cover transition-opacity duration-700 ${index === activeSlide ? "opacity-100" : "opacity-0"}`}
                  priority={index === 0}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-4 text-xs uppercase tracking-wide text-slate-600">
            <span className="inline-flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-slate-500" />
              orders@hotbray.co.uk
            </span>
            <span className="inline-flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-slate-500" />
              +44 (0) 20 8554 50011
            </span>
            <Link href="/admin" className="hover:text-slate-900">
              My Account
            </Link>
            <Link href="/admin/news" className="hover:text-slate-900">
              Support & Feedback
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 hover:text-slate-900"
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
