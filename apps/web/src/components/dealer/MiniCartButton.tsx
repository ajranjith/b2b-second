'use client';

import { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MiniCartButtonProps {
    isOpen: boolean;
    onToggle: () => void;
    itemCount: number;
}

export default function MiniCartButton({ isOpen, onToggle, itemCount }: MiniCartButtonProps) {
    const [animateBadge, setAnimateBadge] = useState(false);
    const [previousCount, setPreviousCount] = useState(itemCount);

    // Trigger bounce animation when item count increases
    useEffect(() => {
        if (itemCount > previousCount) {
            setAnimateBadge(true);
            const timer = setTimeout(() => setAnimateBadge(false), 600);
            return () => clearTimeout(timer);
        }
        setPreviousCount(itemCount);
    }, [itemCount, previousCount]);

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <Button
                onClick={onToggle}
                className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 relative group"
                aria-label={`Shopping cart with ${itemCount} items`}
            >
                <ShoppingCart className="h-6 w-6 text-white" />

                {itemCount > 0 && (
                    <Badge
                        variant="outline"
                        className={`absolute -top-2 -right-2 h-6 min-w-[24px] px-1 rounded-full bg-red-500 text-white border-2 border-white flex items-center justify-center font-bold text-xs
              ${animateBadge ? 'animate-bounce-scale' : ''}
            `}
                    >
                        {itemCount > 99 ? '99+' : itemCount}
                    </Badge>
                )}

                {/* Pulse ring effect when items in cart */}
                {itemCount > 0 && !isOpen && (
                    <span className="absolute inset-0 rounded-full bg-blue-400 opacity-75 animate-ping" />
                )}
            </Button>

            <style jsx>{`
        @keyframes bounce-scale {
          0%, 100% {
            transform: scale(1);
          }
          25% {
            transform: scale(1.3);
          }
          50% {
            transform: scale(0.9);
          }
          75% {
            transform: scale(1.15);
          }
        }
        
        .animate-bounce-scale {
          animation: bounce-scale 0.6s ease-in-out;
        }
      `}</style>
        </div>
    );
}
