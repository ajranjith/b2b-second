'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CartProvider } from '@/context/CartContext';
import { ReferenceHeader } from '@/components/layouts/ReferenceHeader';
import { AnnouncementTicker, MessageDrawer } from '@/components/global';
import { LoadingProvider } from '@/components/global/LoadingProvider';
import type { Announcement } from '@/types/dealer';
import { mockAnnouncements } from '@/mocks/dealer-data';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

function DealerLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isMessageDrawerOpen, setIsMessageDrawerOpen] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);

  // TODO: Get cart count from context
  const cartItemCount = 0;

  const handleAnnouncementClick = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsMessageDrawerOpen(true);
  };

  const handleSearchSubmit = (query: string) => {
    router.push(`/dealer/search?q=${encodeURIComponent(query)}`);
  };

  const handleMenuToggle = () => {
    setIsSideMenuOpen(!isSideMenuOpen);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Reference-Style Header (Sticky) */}
      <div className="sticky top-0 z-[1100]">
        <ReferenceHeader
          cartItemCount={cartItemCount}
          dealerName="Premium Motors Ltd"
          onSearchSubmit={handleSearchSubmit}
          onMenuToggle={handleMenuToggle}
        />
      </div>

      {/* Announcement Ticker (Required on every page) */}
      <div
        className="sticky z-[1050] bg-slate-100 border-b border-slate-200"
        style={{
          top: 'calc(32px + 72px + 56px)', // Utility + Main + Nav heights
        }}
      >
        <div className="h-10">
          <AnnouncementTicker
            announcements={mockAnnouncements}
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
              'fixed left-0 top-0 bottom-0 w-72 bg-white z-[1300] shadow-xl transition-transform lg:hidden',
              isSideMenuOpen ? 'translate-x-0' : '-translate-x-full'
            )}
          >
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Menu</h2>
              <nav className="space-y-2">
                <a href="/dealer/dashboard" className="block py-2 text-slate-700 hover:text-blue-600">
                  Dashboard
                </a>
                <a href="/dealer/search" className="block py-2 text-slate-700 hover:text-blue-600">
                  Search Parts
                </a>
                <a href="/dealer/cart" className="block py-2 text-slate-700 hover:text-blue-600">
                  Cart
                </a>
                <a href="/dealer/orders" className="block py-2 text-slate-700 hover:text-blue-600">
                  Orders
                </a>
                <a href="/dealer/backorders" className="block py-2 text-slate-700 hover:text-blue-600">
                  Backorders
                </a>
                <a href="/dealer/account" className="block py-2 text-slate-700 hover:text-blue-600">
                  Account
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

export default function DealerLayout({ children }: { children: React.ReactNode }) {
  return (
    <LoadingProvider>
      <CartProvider>
        <DealerLayoutContent>{children}</DealerLayoutContent>
      </CartProvider>
    </LoadingProvider>
  );
}
