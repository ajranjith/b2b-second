"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ReferenceHeader } from "@/components/dealer/ReferenceHeader";
import { AnnouncementTicker } from "@/components/global/AnnouncementTicker";
import { SideNav } from "@/components/layouts/SideNav";
import { BottomNav } from "@/components/layouts/BottomNav";
import { MessageDrawer } from "@/components/global/MessageDrawer";
import { cn } from "@/lib/utils";
import type { Announcement } from "@/types/dealer";

interface AppShellProps {
  children: React.ReactNode;
  announcements?: Announcement[];
  header?: React.ReactNode;
  ticker?: React.ReactNode;
  sideNav?: React.ReactNode;
  bottomNav?: React.ReactNode;
}

interface AppShellBlockProps {
  children: React.ReactNode;
  className?: string;
  spacing?: "none" | "small" | "medium" | "large";
}

export function AppShell({ children, announcements = [], header, ticker, sideNav, bottomNav }: AppShellProps) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (isLoading) {
      document.body.classList.add("app-loading");
    } else {
      document.body.classList.remove("app-loading");
    }
    return () => {
      document.body.classList.remove("app-loading");
    };
  }, [isLoading]);

  const handleAnnouncementClick = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
  };

  const handleDrawerClose = () => {
    setSelectedAnnouncement(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-blue-600 z-[100] animate-pulse" />
      )}

      <div className="sticky top-0 z-50 bg-white">
        {header ?? <ReferenceHeader />}
        <div className="h-10 border-b border-slate-200">
          {ticker ?? (
            <AnnouncementTicker
              announcements={announcements}
              onAnnouncementClick={handleAnnouncementClick}
              autoRotateInterval={8}
            />
          )}
        </div>
      </div>

      <div className="flex">
        <aside className="hidden lg:block fixed left-0 top-[152px] bottom-0 w-[260px] bg-white border-r border-slate-200 overflow-y-auto">
          {sideNav ?? <SideNav />}
        </aside>

        {isSideNavOpen && (
          <>
            <div
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsSideNavOpen(false)}
            />
            <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-[260px] bg-white z-50 overflow-y-auto">
              {sideNav ?? <SideNav onNavigate={() => setIsSideNavOpen(false)} />}
            </aside>
          </>
        )}

        <main className="flex-1 lg:ml-[260px] min-h-[calc(100vh-152px)]">
          <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 md:py-8 pb-24 lg:pb-8">
            {children}
          </div>
        </main>
      </div>

      <div className="lg:hidden">
        {bottomNav ?? <BottomNav />}
      </div>

      <MessageDrawer
        isOpen={selectedAnnouncement !== null}
        onClose={handleDrawerClose}
        announcement={selectedAnnouncement}
      />
    </div>
  );
}

export function AppShellContent({ children, className }: AppShellBlockProps) {
  return <div className={className}>{children}</div>;
}

export function AppShellSection({ children, className, spacing = "none" }: AppShellBlockProps) {
  const spacingClass =
    spacing === "small"
      ? "space-y-3"
      : spacing === "medium"
        ? "space-y-6"
        : spacing === "large"
          ? "space-y-8"
          : "";
  return <section className={cn(spacingClass, className)}>{children}</section>;
}
