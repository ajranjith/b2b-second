"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAuthToken } from "@/lib/auth";
import {
  getDealerProfile,
  getOrders,
  getPricingContext,
} from "@/lib/services/dealerApi";
import styles from "./dashboard-theme.module.css";

const heroSlides = [
  {
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1600",
    title: "Land Rover Genuine Parts",
  },
  {
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1600",
    title: "Dealer Fulfilment Network",
  },
  {
    image: "https://images.unsplash.com/photo-1486497395400-7ec0c034a62f?q=80&w=1600",
    title: "Fast Dispatch and Coverage",
  },
];

const verticalSlides = [
  {
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=600",
    title: "Defender L663",
    subtitle: "Accessories in stock",
  },
  {
    image: "https://images.unsplash.com/photo-1486497395400-7ec0c034a62f?q=80&w=600",
    title: "Range Rover",
    subtitle: "Daily replenishment",
  },
  {
    image: "https://images.unsplash.com/photo-1562612174-889816694e97?q=80&w=600",
    title: "Jaguar",
    subtitle: "OEM + alternatives",
  },
];

const tickerItems = [
  "15% discount on L663 steering components",
  "Global shipping active",
  "OEM specialist stock arriving daily",
  "Same day processing cut-off 6PM",
];

const partStripImages = [
  "https://images.unsplash.com/photo-1635773054018-029053e53ee6?q=80&w=600",
  "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?q=80&w=600",
  "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=600",
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=600",
  "https://images.unsplash.com/photo-1486262715619-01b8c247a552?q=80&w=600",
];

export default function DealerDashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof getOrders>>>([]);
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getDealerProfile>>>(null);
  const [pricing, setPricing] = useState<Awaited<ReturnType<typeof getPricingContext>>>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [rightIndex, setRightIndex] = useState(0);

  useEffect(() => {
    Promise.all([getOrders(), getDealerProfile(), getPricingContext()])
      .then(([ordersData, profileData, pricingData]) => {
        setOrders(ordersData);
        setProfile(profileData);
        setPricing(pricingData);
      })
      .catch(() => setError("Unable to load dashboard data."))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 3800);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    // Left rail stays constant; right rail rotates.
    const timer = window.setInterval(() => {
      setRightIndex((prev) => (prev + 1) % verticalSlides.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, []);

  const recentOrders = useMemo(() => {
    if (orders.length === 0) return [];
    return Array.from({ length: Math.max(3, Math.min(8, orders.length)) }, (_, index) => {
      const order = orders[index % orders.length];
      return {
        rowId: `${order.id}-${index}`,
        orderId: order.id,
        orderNo: order.orderNo,
        createdAt: order.createdAt,
        status: order.status,
        total: order.lines.reduce((sum, line) => sum + line.qty * line.unitPrice, 0),
      };
    });
  }, [orders]);

  const logout = () => {
    clearAuthToken();
    router.push("/dealer/login");
  };

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.logo}>HOTBRAY</div>
          <nav className={styles.topNav}>
            <Link href="/dealer/dashboard" className={styles.navItem}>
              Dashboard
            </Link>
            <Link href="/dealer/search" className={styles.navItem}>
              Search
            </Link>
            <Link href="/dealer/orders" className={styles.navItem}>
              Orders
            </Link>
            <Link href="/dealer/cart" className={styles.navItem}>
              Cart
            </Link>
            <Link href="/dealer/account" className={styles.navItem}>
              Account
            </Link>
            <button type="button" className={styles.navButton} onClick={logout}>
              Logout
            </button>
          </nav>
        </div>

        <div className={styles.hero}>
          {heroSlides.map((slide, index) => (
            <div
              key={slide.image}
              className={`${styles.heroSlide} ${index === heroIndex ? styles.heroSlideActive : ""}`}
              style={{ backgroundImage: `url(${slide.image})` }}
            />
          ))}
          <div className={styles.heroOverlay}>
            <h1 className={styles.heroTitle}>{heroSlides[heroIndex].title}</h1>
          </div>
        </div>
      </header>

      <div className={styles.tickerWrap}>
        <div className={styles.tickerTrack}>
          {tickerItems.concat(tickerItems).map((item, index) => (
            <span key={`${item}-${index}`} className={styles.tickerItem}>
              * {item}
            </span>
          ))}
        </div>
      </div>

      <main className={styles.workspace}>
        <aside className={styles.leftRail}>
          {verticalSlides.map((slide, index) => (
            <div
              key={`left-${slide.image}`}
              className={`${styles.leftSlide} ${index === 0 ? styles.leftSlideActive : ""}`}
              style={{ backgroundImage: `url(${slide.image})` }}
            />
          ))}
          <div className={styles.leftOverlay} />
          <div className={styles.leftLinks}>
            <Link href="/dealer/dashboard" className={`${styles.railLink} ${styles.railLinkDashboard}`}>
              Dashboard
            </Link>
            <Link href="/dealer/search" className={`${styles.railLink} ${styles.railLinkSearch}`}>
              Part Search
            </Link>
            <Link href="/dealer/orders" className={`${styles.railLink} ${styles.railLinkOrders}`}>
              Orders
            </Link>
            <Link href="/dealer/backorders" className={`${styles.railLink} ${styles.railLinkBackorders}`}>
              Backorders
            </Link>
            <Link href="/dealer/news" className={`${styles.railLink} ${styles.railLinkNews}`}>
              Portal News
            </Link>
            <Link href="/dealer/account" className={`${styles.railLink} ${styles.railLinkAccount}`}>
              Account
            </Link>
          </div>
        </aside>

        <section className={styles.centerColumn}>
          <div className={styles.commandTitle}>{profile?.account.companyName || "Dealer Account"}</div>

          <div className={styles.summaryGrid}>
            <Link href="/dealer/account" className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Credit Status</div>
              <div className={styles.summaryValue}>{profile?.account.status || "ACTIVE"}</div>
              <div className={styles.summaryMeta}>Account operational status</div>
            </Link>
            <Link href="/dealer/account" className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Account Type</div>
              <div className={styles.summaryValue}>Tiered Dealer</div>
              <div className={styles.summaryMeta}>
                GN/ES/BR: {pricing?.genuineTier || "-"} / {pricing?.aftermarketEsTier || "-"} / {pricing?.aftermarketBTier || "-"}
              </div>
            </Link>
            <Link href="/dealer/account" className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Dealer Code</div>
              <div className={styles.summaryValue}>{profile?.account.accountNo || "N/A"}</div>
              <div className={styles.summaryMeta}>Use in support and order references</div>
            </Link>
          </div>

          <section className={styles.ordersPanel}>
            <div className={styles.panelHeader}>Recent Order Activity ({recentOrders.length})</div>
            <div className={styles.ordersList}>
              {isLoading ? <div className={styles.empty}>Loading dashboard...</div> : null}
              {error ? <div className={styles.empty}>{error}</div> : null}
              {!isLoading && !error && recentOrders.length === 0 ? (
                <div className={styles.empty}>
                  No recent orders for this dealer account yet.
                  <br />
                  Place an order from Search and it will appear here.
                </div>
              ) : null}
              {!isLoading && !error
                ? recentOrders.map((order) => (
                    <Link
                      key={order.rowId}
                      href={`/dealer/orders/${order.orderId}`}
                      className={`${styles.orderRow} ${styles.hoverPop}`}
                      data-tip={`Open ${order.orderNo}`}
                    >
                      <div className={styles.orderNo}>{order.orderNo}</div>
                      <div>{order.createdAt}</div>
                      <div className={styles.orderStatus}>{order.status}</div>
                      <div className={styles.orderTotal}>GBP {order.total.toFixed(2)}</div>
                    </Link>
                  ))
                : null}
            </div>
          </section>
        </section>

        <aside className={styles.rightRail}>
          {verticalSlides.map((slide, index) => (
            <div
              key={slide.image}
              className={`${styles.verticalSlide} ${index === rightIndex ? styles.verticalSlideActive : ""}`}
              style={{ backgroundImage: `url(${slide.image})` }}
            />
          ))}
          <div className={styles.rightOverlay} />
        </aside>
      </main>

      <div className={styles.partsTicker}>
        <div className={styles.partsTrack}>
          {partStripImages.concat(partStripImages).map((img, index) => (
            <div key={`${img}-${index}`} className={styles.partsCard} style={{ backgroundImage: `url(${img})` }} />
          ))}
        </div>
      </div>
      <footer className={styles.footer}>Hotbray Global Distribution</footer>
    </div>
  );
}
