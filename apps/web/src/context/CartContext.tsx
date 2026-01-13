'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface CartUIContextType {
    isMiniCartOpen: boolean;
    toggleMiniCart: () => void;
    openMiniCart: () => void;
    closeMiniCart: () => void;
}

const CartUIContext = createContext<CartUIContextType | undefined>(undefined);

interface CartProviderProps {
    children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
    const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);

    const toggleMiniCart = useCallback(() => {
        setIsMiniCartOpen((prev) => !prev);
    }, []);

    const openMiniCart = useCallback(() => {
        setIsMiniCartOpen(true);
    }, []);

    const closeMiniCart = useCallback(() => {
        setIsMiniCartOpen(false);
    }, []);

    return (
        <CartUIContext.Provider
            value={{
                isMiniCartOpen,
                toggleMiniCart,
                openMiniCart,
                closeMiniCart,
            }}
        >
            {children}
        </CartUIContext.Provider>
    );
}

export function useCartUI() {
    const context = useContext(CartUIContext);
    if (context === undefined) {
        throw new Error('useCartUI must be used within a CartProvider');
    }
    return context;
}
