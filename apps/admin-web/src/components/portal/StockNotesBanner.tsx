"use client";

type StockNotesBannerProps = {
  showZeroStock: boolean;
  showOrderedOnDemand: boolean;
};

export function StockNotesBanner({ showZeroStock, showOrderedOnDemand }: StockNotesBannerProps) {
  if (!showZeroStock && !showOrderedOnDemand) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
      <div className="font-semibold">Please note</div>
      <div className="mt-1 space-y-1 text-xs">
        {showZeroStock && (
          <p>
            For products with zero stock, please contact your customer service manager for
            availability.
          </p>
        )}
        {showOrderedOnDemand && (
          <p>
            Ordered on Demand – This product is non-stocked and will only be ordered once your order
            is placed on the system.
          </p>
        )}
      </div>
    </div>
  );
}
