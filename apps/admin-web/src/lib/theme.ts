/**
 * Theme Tokens
 * Centralized design system tokens for spacing, colors, typography, and more
 */

export const theme = {
  // === SPACING ===
  spacing: {
    xs: "0.25rem", // 4px
    sm: "0.5rem", // 8px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
    "2xl": "3rem", // 48px
    "3xl": "4rem", // 64px
  },

  // Layout specific
  layout: {
    headerHeight: {
      desktop: "72px",
      mobile: "64px",
    },
    tickerHeight: "40px",
    sideNavWidth: "260px",
    bottomNavHeight: "64px",
    contentMaxWidth: "1440px",
    contentPadding: {
      desktop: "32px",
      mobile: "16px",
    },
    drawerWidth: {
      desktop: "480px",
      mobile: "100%",
    },
  },

  // === BORDER RADIUS ===
  radius: {
    sm: "0.375rem", // 6px
    md: "0.5rem", // 8px
    lg: "0.75rem", // 12px
    xl: "1rem", // 16px
    "2xl": "1.5rem", // 24px
    full: "9999px",
  },

  // === SHADOWS ===
  shadow: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  },

  // === TYPOGRAPHY ===
  typography: {
    fontFamily: {
      sans: 'var(--font-sans, "Trebuchet MS"), sans-serif',
      display: 'var(--font-display, "Times New Roman"), serif',
      mono: "ui-monospace, monospace",
    },
    fontSize: {
      xs: "0.75rem", // 12px
      sm: "0.875rem", // 14px
      base: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      "2xl": "1.5rem", // 24px
      "3xl": "1.875rem", // 30px
      "4xl": "2.25rem", // 36px
      "5xl": "3rem", // 48px
    },
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
    lineHeight: {
      tight: "1.25",
      normal: "1.5",
      relaxed: "1.75",
    },
  },

  // === COLORS ===
  colors: {
    // Brand
    primary: {
      50: "#eff6ff",
      100: "#dbeafe",
      200: "#bfdbfe",
      300: "#93c5fd",
      400: "#60a5fa",
      500: "#3b82f6", // Main brand color
      600: "#2563eb",
      700: "#1d4ed8",
      800: "#1e40af",
      900: "#1e3a8a",
    },

    // Neutrals
    slate: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
    },

    // Status colors
    status: {
      success: {
        bg: "#dcfce7",
        text: "#166534",
        border: "#bbf7d0",
      },
      warning: {
        bg: "#fef3c7",
        text: "#92400e",
        border: "#fde68a",
      },
      error: {
        bg: "#fee2e2",
        text: "#991b1b",
        border: "#fecaca",
      },
      info: {
        bg: "#dbeafe",
        text: "#1e40af",
        border: "#bfdbfe",
      },
      neutral: {
        bg: "#f1f5f9",
        text: "#475569",
        border: "#e2e8f0",
      },
    },

    // Stock status
    stock: {
      inStock: {
        bg: "#dcfce7",
        text: "#166534",
        border: "#bbf7d0",
      },
      lowStock: {
        bg: "#fef3c7",
        text: "#92400e",
        border: "#fde68a",
      },
      backorder: {
        bg: "#dbeafe",
        text: "#1e40af",
        border: "#bfdbfe",
      },
      outOfStock: {
        bg: "#fee2e2",
        text: "#991b1b",
        border: "#fecaca",
      },
    },
  },

  // === BREAKPOINTS ===
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },

  // === TRANSITIONS ===
  transition: {
    fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
    base: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
    slow: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
  },

  // === Z-INDEX ===
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    overlay: 30,
    modal: 40,
    popover: 50,
    toast: 60,
  },

  // === TABLE DENSITY ===
  table: {
    density: {
      comfortable: {
        rowHeight: "56px",
        cellPadding: "16px",
        fontSize: "14px",
      },
      dense: {
        rowHeight: "40px",
        cellPadding: "8px",
        fontSize: "13px",
      },
    },
  },
} as const;

export type Theme = typeof theme;
export type ThemeColors = typeof theme.colors;
export type ThemeSpacing = typeof theme.spacing;
