"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Mail, Phone } from "lucide-react";
import { removeAuthToken } from "@/lib/auth";
import { fetchAdminBanners } from "@/lib/services/bannerApi";
import { HeroBanner, type HeroBannerItem } from "@repo/ui";

const navLinks = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Dealers", href: "/admin/dealers" },
  { label: "Admin Users", href: "/admin/admin-users" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Exports", href: "/admin/exports" },
  { label: "Imports", href: "/admin/imports" },
  { label: "News Articles", href: "/admin/news" },
];

const defaultSlides: HeroBannerItem[] = [
  { id: "admin-default-1", mediaUrl: "/brand/hotbray/jlr-dual-brand.webp" },
  { id: "admin-default-2", mediaUrl: "/brand/hotbray/pexels-jan-kopiva-3399938.webp" },
  { id: "admin-default-3", mediaUrl: "/brand/hotbray/pexels-pixabay-162553.webp" },
  { id: "admin-default-4", mediaUrl: "/brand/hotbray/zoom-air-suspension.webp" },
];

export function AdminHeaderBar() {
  const router = useRouter();
  const [slides, setSlides] = useState<HeroBannerItem[]>(defaultSlides);
  const activeSlides = useMemo(() => (slides.length ? slides : defaultSlides), [slides]);

  useEffect(() => {
    fetchAdminBanners()
      .then((data: any[]) => {
        if (data.length) {
          const mapped = data.map((slide, index) => ({
            id: slide.id ?? slide.src ?? slide.url ?? `admin-banner-${index}`,
            mediaUrl: slide.src ?? slide.url,
            mediaType: slide.mediaType,
            posterUrl: slide.posterUrl,
            title: slide.title,
            subtitle: slide.subtitle,
            ctaLabel: slide.ctaLabel,
            ctaHref: slide.ctaHref,
          })) as HeroBannerItem[];
          setSlides(mapped);
        }
      })
      .catch(() => {
        // Keep defaults on error.
      });
    const handleUpdate = () => {
      fetchAdminBanners()
        .then((data: any[]) => {
          if (data.length) {
            const mapped = data.map((slide, index) => ({
              id: slide.id ?? slide.src ?? slide.url ?? `admin-banner-${index}`,
              mediaUrl: slide.src ?? slide.url,
              mediaType: slide.mediaType,
              posterUrl: slide.posterUrl,
              title: slide.title,
              subtitle: slide.subtitle,
              ctaLabel: slide.ctaLabel,
              ctaHref: slide.ctaHref,
            })) as HeroBannerItem[];
            setSlides(mapped);
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
          <Link href="/admin/dashboard" className="flex items-center gap-3">
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
            <HeroBanner
              items={activeSlides}
              variant="fade"
              heightClassName="h-[86px]"
              className="w-full max-w-[520px]"
              contentClassName="px-4 pb-4"
            />
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
            <Link href="/admin/dashboard" className="hover:text-slate-900">
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
