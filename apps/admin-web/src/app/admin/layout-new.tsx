"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminHeader } from "@/components/layouts/AdminHeader";
import { AnnouncementTicker, MessageDrawer, LoadingProvider } from "@/components/global";
import type { Announcement } from "@repo/lib";
import { Toaster } from "@repo/ui";
import { cn } from "@/lib/utils";

// Mock admin announcements
const adminAnnouncements: Announcement[] = [
  {
    id: "admin-1",
    type: "urgent",
    title: "System Maintenance Scheduled",
    message:
      "Scheduled maintenance will occur on Sunday, Jan 20th from 2:00 AM to 4:00 AM GMT. System will be unavailable during this time.",
    timestamp: new Date().toISOString(),
    read: false,
  },
  {
    id: "admin-2",
    type: "info",
    title: "New Dealer Registration",
    message:
      "3 new dealer applications pending review. Please review and approve/reject within 48 hours.",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: false,
  },
  {
    id: "admin-3",
    type: "promo",
    title: "Q1 Performance Report Available",
    message:
      "Q1 2026 performance report is now available in the Reports section. Review dealer performance metrics and sales data.",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    read: false,
  },
  {
    id: "admin-4",
    type: "warning",
    title: "High Volume Alert",
    message: "Order volume is 45% above normal. Consider allocating additional support resources.",
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    read: false,
  },
];

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isMessageDrawerOpen, setIsMessageDrawerOpen] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);

  // TODO: Get notification count from context/API
  const notificationCount = 5;

  const handleAnnouncementClick = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsMessageDrawerOpen(true);
  };

  const handleSearchSubmit = (query: string) => {
    router.push(`/admin/search?q=${encodeURIComponent(query)}`);
  };

  const handleMenuToggle = () => {
    setIsSideMenuOpen(!isSideMenuOpen);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Admin Header (Sticky) */}
      <div className="sticky top-0 z-[1100]">
        <AdminHeader
          notificationCount={notificationCount}
          adminName="Admin User"
          onSearchSubmit={handleSearchSubmit}
          onMenuToggle={handleMenuToggle}
        />
      </div>

      {/* Announcement Ticker (Required on every page) */}
      <div
        className="sticky z-[1050] bg-slate-100 border-b border-slate-200"
        style={{
          top: "calc(32px + 72px + 56px)", // Utility + Main + Nav heights
        }}
      >
        <div className="h-10">
          <AnnouncementTicker
            announcements={adminAnnouncements}
            onAnnouncementClick={handleAnnouncementClick}
          />
        </div>
      </div>

      {/* Side Menu Overlay (Mobile) */}
      {isSideMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[1200] lg:hidden"
            onClick={() => setIsSideMenuOpen(false)}
          />
          <div
            className={cn(
              "fixed left-0 top-0 bottom-0 w-72 bg-white z-[1300] shadow-xl transition-transform lg:hidden",
              isSideMenuOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Admin Menu</h2>
              <nav className="space-y-2">
                <a
                  href="/admin/dashboard"
                  className="block py-2 text-slate-700 hover:text-blue-600"
                >
                  Dashboard
                </a>
                <a href="/admin/orders" className="block py-2 text-slate-700 hover:text-blue-600">
                  Orders
                </a>
                <a href="/admin/dealers" className="block py-2 text-slate-700 hover:text-blue-600">
                  Dealers
                </a>
                <a href="/admin/users" className="block py-2 text-slate-700 hover:text-blue-600">
                  Users
                </a>
                <a
                  href="/admin/templates"
                  className="block py-2 text-slate-700 hover:text-blue-600"
                >
                  Templates
                </a>
                <a href="/admin/imports" className="block py-2 text-slate-700 hover:text-blue-600">
                  Imports
                </a>
                <a
                  href="/admin/order-entry"
                  className="block py-2 text-slate-700 hover:text-blue-600"
                >
                  Order Entry
                </a>
              </nav>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="relative">
        <div className="max-w-[1440px] mx-auto px-6 py-8">{children}</div>
      </main>

      {/* Message Drawer */}
      <MessageDrawer
        isOpen={isMessageDrawerOpen}
        announcement={selectedAnnouncement}
        onClose={() => setIsMessageDrawerOpen(false)}
      />

      {/* Toast Notifications */}
      <Toaster position="top-right" />
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <LoadingProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </LoadingProvider>
  );
}
