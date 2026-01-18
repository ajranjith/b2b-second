import { Truck, Zap, Store, Check } from 'lucide-react';
import type { DispatchMethod } from '@/types/dealer';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface DispatchOption {
  id: DispatchMethod;
  name: string;
  description: string;
  estimatedDays: string;
  price: number;
  icon: React.ComponentType<{ className?: string }>;
}

const dispatchOptions: DispatchOption[] = [
  {
    id: 'standard',
    name: 'Standard Delivery',
    description: 'Delivery within 3-5 business days',
    estimatedDays: '3-5 days',
    price: 0,
    icon: Truck,
  },
  {
    id: 'express',
    name: 'Express Delivery',
    description: 'Next working day delivery',
    estimatedDays: '1 day',
    price: 15.0,
    icon: Zap,
  },
  {
    id: 'collection',
    name: 'Click & Collect',
    description: 'Collect from our warehouse',
    estimatedDays: '2-3 days',
    price: 0,
    icon: Store,
  },
];

interface DispatchMethodSelectorProps {
  selectedMethod: DispatchMethod;
  onSelectMethod: (method: DispatchMethod) => void;
  className?: string;
}

/**
 * Dispatch Method Selector Component
 *
 * Radio card selector for delivery methods:
 * - Standard Delivery (free)
 * - Express Delivery (£15)
 * - Click & Collect (free)
 */
export function DispatchMethodSelector({
  selectedMethod,
  onSelectMethod,
  className,
}: DispatchMethodSelectorProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {dispatchOptions.map((option) => {
        const isSelected = selectedMethod === option.id;
        const Icon = option.icon;

        return (
          <Card
            key={option.id}
            className={cn(
              'cursor-pointer transition-all hover:shadow-md',
              isSelected && 'ring-2 ring-blue-600 bg-blue-50'
            )}
            onClick={() => onSelectMethod(option.id)}
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                {/* Radio Circle */}
                <div className="flex-shrink-0 mt-1">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                      isSelected
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-slate-300 bg-white'
                    )}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                </div>

                {/* Icon */}
                <div
                  className={cn(
                    'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center',
                    isSelected ? 'bg-blue-100' : 'bg-slate-100'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-6 h-6',
                      isSelected ? 'text-blue-600' : 'text-slate-600'
                    )}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3
                        className={cn(
                          'font-semibold text-slate-900',
                          isSelected && 'text-blue-900'
                        )}
                      >
                        {option.name}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {option.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-slate-500">
                          Est. {option.estimatedDays}
                        </span>
                        {option.price > 0 && (
                          <span className="text-sm font-semibold text-blue-600">
                            {formatCurrency(option.price)}
                          </span>
                        )}
                        {option.price === 0 && (
                          <span className="text-sm font-semibold text-green-600">
                            Free
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
