"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnnouncementTicker } from "@/components/portal/AnnouncementTicker";
import { MessageDrawer } from "@/components/portal/MessageDrawer";
import { DealerHeaderBar } from "@/components/portal/DealerHeaderBar";
import { SideNav } from "@/components/portal/SideNav";
import { BottomNav } from "@/components/portal/BottomNav";
import { fetchAnnouncements } from "@/lib/services/dealerApi";
import { type Announcement } from "@/lib/mock/dealerData";
import { useLoadingCursor } from "@/hooks/useLoadingCursor";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [overlayActive, setOverlayActive] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchAnnouncements().then(setAnnouncements);
  }, []);

  useEffect(() => {
    setRouteLoading(true);
    const timer = setTimeout(() => setRouteLoading(false), 450);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  useEffect(() => {
    const scope = (pathname || "/dealer")
      .replace(/^\/+/, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .toUpperCase();
    const annotate = () => {
      const actionable = document.querySelectorAll<HTMLElement>('a[href], button, [role="button"]');
      actionable.forEach((element, index) => {
        if (!element.getAttribute("data-fid")) {
          element.setAttribute("data-fid", `FID-AUTO-${scope}-${String(index + 1).padStart(4, "0")}`);
        }
        if (!element.getAttribute("data-action-id")) {
          const kind = element.tagName.toLowerCase() === "a" ? "NAV" : "ACT";
          element.setAttribute(
            "data-action-id",
            `ACT-AUTO-${scope}-${kind}-${String(index + 1).padStart(4, "0")}`,
          );
        }
      });
    };

    annotate();
    const observer = new MutationObserver(() => annotate());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [pathname, searchParams]);

  useLoadingCursor(routeLoading || overlayActive);

  const handleOpenMessage = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setDrawerOpen(true);
  };

  const bannerImage = useMemo(() => {
    if (!pathname) return "/brand/eurospare/black-side-box-snow.jpg";
    if (pathname.startsWith("/dealer/search")) {
      return "/brand/hotbray/jlr-dual-brand.jpg";
    }
    if (pathname.startsWith("/dealer/cart")) {
      return "/brand/hotbray/pexels-pixabay-162553.jpg";
    }
    if (pathname.startsWith("/dealer/checkout")) {
      return "/brand/eurospare/black-side-box-snow.jpg";
    }
    if (pathname.startsWith("/dealer/orders") || pathname.startsWith("/dealer/backorders")) {
      return "/brand/hotbray/pexels-jan-kopiva-3399938.jpg";
    }
    if (pathname.startsWith("/dealer")) {
      return "/brand/eurospare/black-side-box-snow.jpg";
    }
    return "/brand/eurospare/black-side-box-snow.jpg";
  }, [pathname]);

  const isFullSearchPage =
    pathname?.includes("/dealer/search") || pathname?.includes("/dealer/dashboard");
  const partStripImages = [
    "https://images.unsplash.com/photo-1635773054018-029053e53ee6?q=80&w=600",
    "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?q=80&w=600",
    "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=600",
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=600",
  ];

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const clickable = target.closest("a, button");
      if (!clickable) return;

      // Skip overlay for dialog triggers, file uploads, and form actions
      if (
        clickable.closest('[data-slot="dialog"]') ||
        clickable.closest('[role="dialog"]') ||
        clickable.hasAttribute("data-no-overlay") ||
        clickable.textContent?.toLowerCase().includes("create") ||
        clickable.textContent?.toLowerCase().includes("upload") ||
        clickable.textContent?.toLowerCase().includes("import") ||
        clickable.closest("form") ||
        (clickable as HTMLButtonElement).type === "submit"
      ) {
        return;
      }

      setOverlayActive(true);
      window.setTimeout(() => setOverlayActive(false), 400);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  if (isFullSearchPage) {
    return (
      <div className="min-h-screen bg-slate-50">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DealerHeaderBar />
      <div className="dgs-progress" style={{ opacity: routeLoading ? 1 : 0 }} />
      <AnnouncementTicker announcements={announcements} onOpenMessage={handleOpenMessage} />
      <div className="max-w-7xl mx-auto px-6 py-8 pb-24 lg:pb-8 relative">
        <div
          className={`dgs-click-overlay${overlayActive ? " is-active" : ""}`}
          aria-hidden="true"
        />
        <div className="flex gap-6">
          <SideNav />
          <main className="flex-1 max-w-[1280px] space-y-6">{children}</main>
        </div>
      </div>
      <BottomNav />
      <div className="overflow-hidden border-y border-[#9d7641] bg-[#5f431f] py-1">
        <div className="inline-flex gap-2 min-w-max animate-[ticker-scroll_18s_linear_infinite]">
          {partStripImages.concat(partStripImages).map((img, index) => (
            <div
              key={`${img}-${index}`}
              className="h-10 w-36 rounded border border-[#d4ad63]/60 bg-cover bg-center"
              style={{ backgroundImage: `url(${img})` }}
            />
          ))}
        </div>
      </div>
      <footer className="bg-gradient-to-b from-[#8f6a2f] to-[#735224] py-2 text-center text-sm font-black uppercase tracking-[0.2em] text-[#f8e6bf]">
        Hotbray Global Distribution
      </footer>
      <MessageDrawer
        open={drawerOpen}
        announcement={selectedAnnouncement}
        onClose={() => setDrawerOpen(false)}
      />
      <style jsx global>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
