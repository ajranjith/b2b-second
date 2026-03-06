"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { searchParts } from "@/lib/services/dealerApi";
import type { Part } from "@/lib/mock/dealerData";
import { clearAuthToken } from "@/lib/auth";
import { useDealerCart } from "@/context/DealerCartContext";
import styles from "./search-theme.module.css";

const heroSlides = [
  {
    image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?q=80&w=1600",
    title: "Land Rover Genuine Parts",
  },
  {
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1600",
    title: "Jaguar Performance Components",
  },
  {
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1600",
    title: "OEM + Aftermarket Coverage",
  },
];

const sideSlides = [
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=600",
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=600",
  "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?q=80&w=600",
];

const tickerItems = ["JLR Approved", "Global Shipping", "OEM Specialist", "Dealer Pricing Live"];

const getStockClass = (status: string) => {
  if (status === "In Stock") return styles.inStock;
  if (status === "Low Stock") return styles.lowStock;
  return styles.backorder;
};

export default function DealerSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [items, setItems] = useState<Part[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(Boolean(initialQuery.trim()));
  const [qtyById, setQtyById] = useState<Record<string, number>>({});
  const [heroIndex, setHeroIndex] = useState(0);
  const [sideIndex, setSideIndex] = useState(0);
  const [displayCount, setDisplayCount] = useState(0);
  const [displaySubtotal, setDisplaySubtotal] = useState(0);
  const [pulseCart, setPulseCart] = useState(false);
  const [flyer, setFlyer] = useState<{ x: number; y: number; key: number } | null>(null);

  const {
    items: cartItems,
    subtotal,
    addItem,
    updateQty,
    removeItem,
  } = useDealerCart();

  const cartItemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.qty, 0),
    [cartItems],
  );

  useEffect(() => {
    const target = cartItemCount;
    const timer = window.setInterval(() => {
      setDisplayCount((prev) => {
        if (prev === target) return prev;
        return prev + Math.sign(target - prev);
      });
    }, 35);
    return () => window.clearInterval(timer);
  }, [cartItemCount]);

  useEffect(() => {
    const target = subtotal;
    const timer = window.setInterval(() => {
      setDisplaySubtotal((prev) => {
        const diff = target - prev;
        if (Math.abs(diff) < 0.05) return target;
        return prev + diff * 0.2;
      });
    }, 30);
    return () => window.clearInterval(timer);
  }, [subtotal]);

  useEffect(() => {
    setPulseCart(true);
    const timer = window.setTimeout(() => setPulseCart(false), 260);
    return () => window.clearTimeout(timer);
  }, [cartItemCount]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 3500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSideIndex((prev) => (prev + 1) % sideSlides.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setQuery(initialQuery);
    if (initialQuery.trim()) {
      void runSearch(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const runSearch = async (value: string) => {
    const cleanQuery = value.trim();
    setSearched(true);

    const next = new URLSearchParams(searchParams.toString());
    if (cleanQuery) {
      next.set("q", cleanQuery);
    } else {
      next.delete("q");
    }
    router.replace(`/dealer/search${next.toString() ? `?${next.toString()}` : ""}`);

    if (!cleanQuery) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const response = await searchParts({
        query: cleanQuery,
        page: 1,
        pageSize: 50,
        stock: "All",
        partType: "All",
      });
      setItems(response.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setQtyById((prev) => {
      const next = { ...prev };
      for (const part of items) {
        if (!next[part.id]) next[part.id] = 1;
      }
      return next;
    });
  }, [items]);

  const logout = () => {
    clearAuthToken();
    router.push("/dealer/login");
  };

  const handleAddToCart = async (event: MouseEvent<HTMLButtonElement>, part: Part, qty: number) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setFlyer({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, key: Date.now() });
    await addItem(part, qty);
  };

  return (
    <div className={styles.root}>
      {flyer ? (
        <div
          key={flyer.key}
          className={styles.flyer}
          style={{ left: flyer.x, top: flyer.y }}
          onAnimationEnd={() => setFlyer(null)}
        >
          +1
        </div>
      ) : null}
      <header className={styles.topbar}>
        <div className={styles.logo}>HOTBRAY</div>
        <nav className={styles.topnav}>
          <Link href="/dealer/dashboard" className={styles.toplink}>
            Dashboard
          </Link>
          <Link href="/dealer/search" className={`${styles.toplink} ${styles.toplinkActive}`}>
            Search
          </Link>
          <Link href="/dealer/orders" className={styles.toplink}>
            Orders
          </Link>
          <Link href="/dealer/cart" className={styles.toplink}>
            Cart
          </Link>
          <Link href="/dealer/account" className={styles.toplink}>
            Account
          </Link>
          <button type="button" className={styles.toplinkButton} onClick={logout}>
            Logout
          </button>
        </nav>
      </header>

      <section className={styles.hero}>
        {heroSlides.map((slide, index) => (
          <div
            key={slide.image}
            className={`${styles.heroSlide} ${index === heroIndex ? styles.heroSlideActive : ""}`}
            style={{ backgroundImage: `url(${slide.image})` }}
          />
        ))}
        <div className={styles.heroOverlay}>
          <div className={styles.heroText}>{heroSlides[heroIndex].title}</div>
        </div>
      </section>

      <section className={styles.workspace}>
        <aside className={styles.sidebar}>
          {sideSlides.map((image, index) => (
            <div
              key={image}
              className={`${styles.sidebarSlide} ${index === sideIndex ? styles.sidebarSlideActive : ""}`}
              style={{ backgroundImage: `url(${image})` }}
            />
          ))}
          <div className={styles.sidebarLabel}>Defender</div>
        </aside>

        <main className={styles.center}>
          <div className={styles.searchRow}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>Search</span>
              <input
                className={styles.searchInput}
                placeholder="Part Number..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void runSearch(query);
                  }
                }}
              />
            </div>
            <button className={styles.searchButton} onClick={() => void runSearch(query)}>
              Search
            </button>
          </div>

          <div className={styles.tableHead}>
            <div>Img</div>
            <div>Part Details</div>
            <div>Description</div>
            <div>Stock</div>
            <div>Price</div>
            <div>Qty</div>
            <div>Action</div>
          </div>

          <div className={styles.results}>
            {!searched ? (
              <div className={styles.empty}>Search by part number or keyword.</div>
            ) : loading ? (
              <div className={styles.empty}>Loading search results...</div>
            ) : items.length === 0 ? (
              <div className={styles.empty}>No results found for "{query}".</div>
            ) : (
              items.map((part) => {
                const qty = qtyById[part.id] || 1;
                const imageSrc =
                  (part as Part & { image?: string }).image ||
                  "https://images.unsplash.com/photo-1486262715619-01b8c247a552?q=80&w=100";

                return (
                  <div key={part.id} className={styles.row}>
                    <img className={styles.thumb} src={imageSrc} alt={part.sku} />
                    <div>
                      <div className={styles.sku}>{part.sku}</div>
                      <div className={styles.dim}>{part.partType || "Part"}</div>
                    </div>
                    <div className={styles.desc}>{part.name}</div>
                    <div className={`${styles.stock} ${getStockClass(part.stockStatus)}`}>
                      {part.stockStatus}
                    </div>
                    <div className={styles.price}>GBP {Number(part.price || 0).toFixed(2)}</div>
                    <div className={styles.qtyCtrl}>
                      <button
                        className={styles.qtyBtn}
                        onClick={() =>
                          setQtyById((prev) => ({
                            ...prev,
                            [part.id]: Math.max(1, (prev[part.id] || 1) - 1),
                          }))
                        }
                      >
                        -
                      </button>
                      <div className={styles.qtyVal}>{qty}</div>
                      <button
                        className={styles.qtyBtn}
                        onClick={() =>
                          setQtyById((prev) => ({
                            ...prev,
                            [part.id]: (prev[part.id] || 1) + 1,
                          }))
                        }
                      >
                        +
                      </button>
                    </div>
                    <button className={styles.addBtn} onClick={(event) => void handleAddToCart(event, part, qty)}>
                      Add
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </main>

        <aside className={styles.sideCart}>
          <div className={styles.sideCartHead}>
            <span>Cart</span>
            <span className={`${styles.badge} ${pulseCart ? styles.badgePulse : ""}`}>{displayCount}</span>
          </div>

          <div className={styles.cartList}>
            {cartItems.length === 0 ? (
              <div className={styles.empty}>Cart is empty.</div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className={styles.cartItem}>
                  <div>
                    <div className={styles.cartSku}>{item.part.sku}</div>
                    <div className={styles.cartPrice}>GBP {Number(item.part.price).toFixed(2)}</div>
                  </div>
                  <div className={styles.cartQty}>
                    <button onClick={() => void updateQty(item.id, Math.max(1, item.qty - 1))}>-</button>
                    <span>{item.qty}</span>
                    <button onClick={() => void updateQty(item.id, item.qty + 1)}>+</button>
                  </div>
                  <div className={styles.cartLineTotal}>GBP {(item.part.price * item.qty).toFixed(0)}</div>
                  <button className={styles.removeItem} onClick={() => void removeItem(item.id)}>
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>

          <div className={styles.cartFooter}>
            <div className={styles.totalRow}>
              <span>Total</span>
              <span>GBP {displaySubtotal.toFixed(2)}</span>
            </div>
            <button className={styles.checkout} onClick={() => router.push("/dealer/cart")}>
              Checkout
            </button>
          </div>
        </aside>
      </section>

      <div className={styles.ticker}>
        <div className={styles.tickerTrack}>
          {tickerItems.concat(tickerItems).map((item, index) => (
            <span key={`${item}-${index}`}>* {item}</span>
          ))}
        </div>
      </div>

      <footer className={styles.footer}>Hotbray Global</footer>
    </div>
  );
}
