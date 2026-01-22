"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface LoadingContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  setIsLoading: () => {},
});

export function useLoading() {
  return useContext(LoadingContext);
}

interface LoadingProviderProps {
  children: ReactNode;
}

/**
 * Loading Provider Component
 *
 * Provides global loading state with:
 * - Cursor change to progress/wait
 * - Top loading bar animation
 * - Automatic route change detection
 * - Manual loading state control
 */
export function LoadingProvider({ children }: LoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Auto-detect route changes
  useEffect(() => {
    setIsLoading(true);
    setProgress(20);

    // Simulate progress
    const timer1 = setTimeout(() => setProgress(50), 100);
    const timer2 = setTimeout(() => setProgress(80), 300);
    const timer3 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 200);
    }, 500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [pathname, searchParams]);

  // Apply cursor class to body
  useEffect(() => {
    if (isLoading) {
      document.body.classList.add("app-loading");
    } else {
      document.body.classList.remove("app-loading");
    }

    return () => {
      document.body.classList.remove("app-loading");
    };
  }, [isLoading]);

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {/* Top Loading Bar */}
      <div
        className={cn(
          "fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 transition-all duration-300 ease-out z-[9999]",
          isLoading ? "opacity-100" : "opacity-0",
        )}
        style={{
          width: `${progress}%`,
          boxShadow: "0 0 10px rgba(59, 130, 246, 0.5)",
        }}
      />

      {children}
    </LoadingContext.Provider>
  );
}

/**
 * Loading Button Component
 *
 * Button that shows loading state during async operations
 */
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  children: ReactNode;
}

export function LoadingButton({
  isLoading = false,
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  const { setIsLoading: setGlobalLoading } = useLoading();

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (props.onClick) {
      setGlobalLoading(true);
      try {
        await props.onClick(e);
      } finally {
        setGlobalLoading(false);
      }
    }
  };

  return (
    <button
      {...props}
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={cn(isLoading && "cursor-wait opacity-70", className)}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}
