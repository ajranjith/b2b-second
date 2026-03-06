"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "Dashboard",
    href: "/dealer/dashboard",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600",
  },
  {
    label: "Search Parts",
    href: "/dealer/search",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=600",
  },
  {
    label: "Cart",
    href: "/dealer/cart",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=600",
  },
  {
    label: "Orders",
    href: "/dealer/orders",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=600",
  },
  {
    label: "News",
    href: "/dealer/news",
    image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=600",
  },
  {
    label: "Account",
    href: "/dealer/account",
    image: "https://images.unsplash.com/photo-1486497395400-7ec0c034a62f?q=80&w=600",
  },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:shrink-0">
      <div className="rounded-2xl border border-[#cfa96a] shadow-sm p-4 bg-[linear-gradient(180deg,rgba(120,84,33,0.35),rgba(74,51,22,0.7)),url('https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=600')] bg-cover bg-center">
        <div className="text-xs font-semibold uppercase text-[#ffe8b8] px-3 py-2">Navigation</div>
        <nav className="mt-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative overflow-hidden flex items-center rounded-xl px-3 py-2 text-sm font-black uppercase tracking-wide transition ${
                  isActive
                    ? "bg-[#d4ad63]/45 text-[#fff3d7]"
                    : "text-[#ffe8b8] hover:text-white hover:bg-[#d4ad63]/35"
                }`}
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(59,36,12,0.55), rgba(59,36,12,0.55)), url('${item.image}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
