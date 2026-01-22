"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useDealerCart } from "@/context/DealerCartContext";
import { removeAuthToken } from "@/lib/auth";

export default function DealerLogoutPage() {
  const router = useRouter();
  const { clearCart } = useDealerCart();

  useEffect(() => {
    clearCart();
    removeAuthToken();
    router.replace("/login");
  }, [clearCart, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
      Logging out...
    </div>
  );
}
