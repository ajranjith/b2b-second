/**
 * Design System Tokens
 * Centralized design tokens for the Dealer Portal UI
 */

export const tokens = {
  // === SPACING ===
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
    '4xl': '6rem',    // 96px

    // Semantic spacing
    container: {
      mobile: '1rem',    // 16px
      tablet: '1.5rem',  // 24px
      desktop: '2rem',   // 32px
    },
    section: {
      small: '1.5rem',   // 24px
      medium: '2rem',    // 32px
      large: '3rem',     // 48px
    },
  },

  // === BORDER RADIUS ===
  radius: {
    none: '0',
    sm: '0.25rem',     // 4px
    md: '0.5rem',      // 8px
    lg: '0.75rem',     // 12px
    xl: '1rem',        // 16px
    '2xl': '1.5rem',   // 24px
    full: '9999px',    // Fully rounded
  },

  // === TYPOGRAPHY ===
  typography: {
    fontFamily: {
      sans: 'var(--font-sans)',
      display: 'var(--font-display)',
      mono: 'var(--font-mono)',
    },

    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],       // 12px / 16px
      sm: ['0.875rem', { lineHeight: '1.25rem' }],   // 14px / 20px
      base: ['1rem', { lineHeight: '1.5rem' }],      // 16px / 24px
      lg: ['1.125rem', { lineHeight: '1.75rem' }],   // 18px / 28px
      xl: ['1.25rem', { lineHeight: '1.75rem' }],    // 20px / 28px
      '2xl': ['1.5rem', { lineHeight: '2rem' }],     // 24px / 32px
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px / 36px
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],  // 36px / 40px
      '5xl': ['3rem', { lineHeight: '1' }],          // 48px
    },

    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },

    letterSpacing: {
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
    },
  },

  // === LAYOUT ===
  layout: {
    header: {
      desktop: '72px',
      mobile: '64px',
    },
    ticker: {
      height: '40px',
      mobileHeight: '36px',
    },
    sideNav: {
      width: '260px',
      collapsed: '72px',
    },
    bottomNav: {
      height: '64px',
    },
    drawer: {
      width: '480px',
      mobileWidth: '100vw',
    },
    content: {
      maxWidth: '1440px',
      comfortable: '1280px',
    },
  },

  // === Z-INDEX ===
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    overlay: 1200,
    modal: 1300,
    popover: 1400,
    toast: 1500,
  },

  // === SHADOWS ===
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none',
  },

  // === TRANSITIONS ===
  transitions: {
    duration: {
      fast: '150ms',
      base: '200ms',
      slow: '300ms',
    },
    timing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
  },

  // === BREAKPOINTS ===
  breakpoints: {
    xs: '375px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1440px',
  },

  // === TABLE DENSITY ===
  table: {
    density: {
      comfortable: {
        padding: '1rem',
        fontSize: '0.875rem',
        lineHeight: '1.5rem',
      },
      dense: {
        padding: '0.5rem',
        fontSize: '0.8125rem',
        lineHeight: '1.25rem',
      },
    },
  },

  // === ANIMATION ===
  animation: {
    ticker: {
      speed: '40s', // Time to scroll full width
      itemDuration: '8s', // Time each item is visible
    },
  },
} as const;

// === COLOR TOKENS (from globals.css) ===
// Use CSS variables for colors to maintain consistency
export const colors = {
  background: 'hsl(var(--color-background))',
  foreground: 'hsl(var(--color-foreground))',
  card: 'hsl(var(--color-card))',
  cardForeground: 'hsl(var(--color-card-foreground))',
  popover: 'hsl(var(--color-popover))',
  popoverForeground: 'hsl(var(--color-popover-foreground))',
  primary: 'hsl(var(--color-primary))',
  primaryForeground: 'hsl(var(--color-primary-foreground))',
  secondary: 'hsl(var(--color-secondary))',
  secondaryForeground: 'hsl(var(--color-secondary-foreground))',
  muted: 'hsl(var(--color-muted))',
  mutedForeground: 'hsl(var(--color-muted-foreground))',
  accent: 'hsl(var(--color-accent))',
  accentForeground: 'hsl(var(--color-accent-foreground))',
  destructive: 'hsl(var(--color-destructive))',
  destructiveForeground: 'hsl(var(--color-destructive-foreground))',
  border: 'hsl(var(--color-border))',
  input: 'hsl(var(--color-input))',
  ring: 'hsl(var(--color-ring))',
} as const;

export type Tokens = typeof tokens;
export type Colors = typeof colors;
