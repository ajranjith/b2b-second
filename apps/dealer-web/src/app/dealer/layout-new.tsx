"use client";

import { CartProvider } from "@/context/CartContext";
import { AppShell } from "@/components/layouts";
import { mockAnnouncements } from "@/mocks/dealer-data";
import { Toaster } from "@repo/ui";

function DealerLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppShell announcements={mockAnnouncements}>{children}</AppShell>
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
