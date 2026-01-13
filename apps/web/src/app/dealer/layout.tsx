'use client';

import { CartProvider } from '@/context/CartContext';
import { useCartUI } from '@/context/CartContext';
import { useCart } from '@/hooks/useCart';
import MiniCartButton from '@/components/dealer/MiniCartButton';
import MiniCart from '@/components/dealer/MiniCart';

function DealerLayoutContent({ children }: { children: React.ReactNode }) {
    const { isMiniCartOpen, toggleMiniCart, closeMiniCart } = useCartUI();
    const { itemCount } = useCart();

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-8">
                            <h1 className="text-2xl font-bold text-slate-900">Hotbray Portal</h1>
                            <nav className="hidden md:flex items-center gap-6">
                                <a href="/dealer/search" className="text-slate-600 hover:text-blue-600 transition-colors">
                                    Search Parts
                                </a>
                                <a href="/dealer/cart" className="text-slate-600 hover:text-blue-600 transition-colors">
                                    Cart
                                </a>
                                <a href="/dealer/orders" className="text-slate-600 hover:text-blue-600 transition-colors">
                                    Orders
                                </a>
                            </nav>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-600">Dealer Portal</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative">
                {children}
            </main>

            {/* Mini Cart Components */}
            <MiniCartButton
                isOpen={isMiniCartOpen}
                onToggle={toggleMiniCart}
                itemCount={itemCount}
            />

            <MiniCart />
        </div>
    );
}

export default function DealerLayout({ children }: { children: React.ReactNode }) {
    return (
        <CartProvider>
            <DealerLayoutContent>{children}</DealerLayoutContent>
        </CartProvider>
    );
}
