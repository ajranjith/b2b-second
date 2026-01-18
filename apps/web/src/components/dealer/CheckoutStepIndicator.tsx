import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  number: number;
  label: string;
  description: string;
}

interface CheckoutStepIndicatorProps {
  currentStep: number;
  className?: string;
}

const steps: Step[] = [
  { number: 1, label: 'Dispatch', description: 'Choose delivery method' },
  { number: 2, label: 'Review', description: 'Confirm your order' },
  { number: 3, label: 'Complete', description: 'Order confirmation' },
];

/**
 * Checkout Step Indicator Component
 *
 * Visual progress indicator for 3-step checkout:
 * - Step 1: Dispatch method selection
 * - Step 2: Order review
 * - Step 3: Confirmation
 */
export function CheckoutStepIndicator({
  currentStep,
  className,
}: CheckoutStepIndicatorProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const isUpcoming = currentStep < step.number;

          return (
            <div key={step.number} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all',
                    isCompleted && 'bg-green-600 text-white',
                    isCurrent && 'bg-blue-600 text-white ring-4 ring-blue-100',
                    isUpcoming && 'bg-slate-200 text-slate-600'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>

                {/* Step Label */}
                <div className="mt-3 text-center">
                  <div
                    className={cn(
                      'text-sm font-semibold',
                      (isCompleted || isCurrent) && 'text-slate-900',
                      isUpcoming && 'text-slate-500'
                    )}
                  >
                    {step.label}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 hidden sm:block">
                    {step.description}
                  </div>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-1 mx-4 transition-all',
                    isCompleted && 'bg-green-600',
                    !isCompleted && 'bg-slate-200'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
