"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnnouncementTicker } from "@/components/portal/AnnouncementTicker";
import { MessageDrawer } from "@/components/portal/MessageDrawer";
import { AdminHeaderBar } from "@/components/portal/AdminHeaderBar";
import { AdminSideNav } from "@/components/portal/AdminSideNav";
import { AdminBottomNav } from "@/components/portal/AdminBottomNav";
import { fetchAnnouncements } from "@/lib/services/dealerApi";
import { type Announcement } from "@/lib/mock/dealerData";
import { useLoadingCursor } from "@/hooks/useLoadingCursor";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [overlayActive, setOverlayActive] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useLoadingCursor(loading || overlayActive);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  useEffect(() => {
    fetchAnnouncements().then((data) => {
      setAnnouncements(data);
      setLoading(false);
    });
  }, []);

  const bannerImage = useMemo(() => {
    if (pathname?.startsWith("/admin/imports")) {
      return "/brand/hotbray/zoom-air-suspension.jpg";
    }
    return "/brand/eurospare/black-side-box-snow.jpg";
  }, [pathname]);

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

  const handleOpenMessage = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setDrawerOpen(true);
  };

  const drawerProps = useMemo(
    () => ({
      open: drawerOpen,
      announcement: selectedAnnouncement,
      onClose: () => setDrawerOpen(false),
    }),
    [drawerOpen, selectedAnnouncement],
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeaderBar />
      <div className="dgs-progress" style={{ opacity: loading ? 1 : 0 }} />
      <AnnouncementTicker announcements={announcements} onOpenMessage={handleOpenMessage} />
      <div className="max-w-7xl mx-auto px-6 py-8 pb-24 lg:pb-8 relative">
        <div
          className="dgs-watermark"
          style={{ backgroundImage: `url(${bannerImage})` }}
          aria-hidden="true"
        />
        <div
          className={`dgs-click-overlay${overlayActive ? " is-active" : ""}`}
          aria-hidden="true"
        />
        <div
          className="dgs-banner"
          style={{ backgroundImage: `url(${bannerImage})` }}
          aria-hidden="true"
        >
          <div className="dgs-banner-overlay" />
        </div>
        <div className="flex gap-6">
          <AdminSideNav />
          <main className="flex-1 max-w-[1280px] space-y-6">{children}</main>
        </div>
      </div>
      <AdminBottomNav />
      <MessageDrawer {...drawerProps} />
    </div>
  );
}
