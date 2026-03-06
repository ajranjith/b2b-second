"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function PageLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Exclude search and add-to-cart actions
      const isSearchAction =
        target.closest("[data-search-action]") ||
        target.closest('form[role="search"]') ||
        target.closest(".search-form") ||
        target.closest('[type="search"]');

      const isCartAction =
        target.closest("[data-cart-action]") ||
        target.closest(".add-to-cart") ||
        target.textContent?.toLowerCase().includes("add to cart");

      if (isSearchAction || isCartAction) {
        return;
      }

      const link = target.closest("a");
      if (link && link.href && !link.target && !link.download) {
        const url = new URL(link.href);
        if (url.origin === window.location.origin && url.pathname !== pathname) {
          setIsLoading(true);
        }
      }
    };
    document.addEventListener("click", handleLinkClick);
    return () => document.removeEventListener("click", handleLinkClick);
  }, [pathname]);

  if (!isLoading) return null;

  return (
    <div
      id="spinner-overlay"
      className="fixed inset-0 flex justify-center items-center bg-white z-[9999] animate-in fade-in duration-200"
    >
      <img
        src="/wheel-1.png"
        alt="Loading..."
        className="loader-wheel w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 object-cover rounded-full"
      />
    </div>
  );
}
