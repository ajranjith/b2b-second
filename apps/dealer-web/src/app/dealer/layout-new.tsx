"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CartProvider } from "@/context/CartContext";
import { AppShell, DealerHeader, SideNav, BottomNav } from "@/components/layouts";
import { AnnouncementTicker, MessageDrawer } from "@/components/global";
import type { Announcement } from "@repo/lib";
import { mockAnnouncements } from "@/mocks/dealer-data";
import { Toaster } from "@repo/ui";

function DealerLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isMessageDrawerOpen, setIsMessageDrawerOpen] = useState(false);

  // TODO: Get cart count from context
  const cartItemCount = 0;

  const handleAnnouncementClick = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsMessageDrawerOpen(true);
  };

  const handleSearchSubmit = (query: string) => {
    router.push(`/dealer/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <>
      <AppShell
        header={
          <DealerHeader
            cartItemCount={cartItemCount}
            dealerName="Premium Motors Ltd"
            onSearchSubmit={handleSearchSubmit}
          />
        }
        ticker={
          <AnnouncementTicker
            announcements={mockAnnouncements}
            onAnnouncementClick={handleAnnouncementClick}
          />
        }
        sideNav={
          <SideNav
            badgeCounts={{
              cart: cartItemCount,
              backorders: 7, // TODO: Get from API
            }}
          />
        }
        bottomNav={<BottomNav cartItemCount={cartItemCount} />}
      >
        {children}
      </AppShell>

      {/* Message Drawer */}
      <MessageDrawer
        isOpen={isMessageDrawerOpen}
        announcement={selectedAnnouncement}
        onClose={() => setIsMessageDrawerOpen(false)}
      />

      {/* Toast Notifications */}
      <Toaster position="top-right" />
    </>
  );
}

export default function DealerLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <DealerLayoutContent>{children}</DealerLayoutContent>
    </CartProvider>
  );
}
