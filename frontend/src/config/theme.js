/**
 * AgeWell+ Theme Configuration
 * Optimized for elderly users with high contrast and large text
 * 
 * Design Principles:
 * - Only 2-3 core colors for simplicity
 * - High contrast ratios (AAA level where possible)
 * - Large, bold typography throughout
 * - Generous spacing and touch targets
 */

export const theme = {
  // Palette: paper + ink + forest green. Saffron and terracotta are sparing accents. No blue or violet.
  colors: {
    paper: { main: '#FAF6EE', sunken: '#F2ECDF', surface: '#FFFFFF' },
    ink: { main: '#1B2A24', secondary: '#4B5B53' },
    line: '#E3DCCB',
    primary: { main: '#1F5F4A', hover: '#174A3A', tint: '#E3EEE7' },
    accent: { saffron: '#E8A33D', terracotta: '#C8643C' },
    status: { success: '#2E7D4F', warning: '#B87A1B', danger: '#B3261E' },
  },

  // Typography Scale - Big & Bold for Elderly Users
  typography: {
    // Font families
    fonts: {
      sans: ['"Atkinson Hyperlegible"', 'system-ui', 'sans-serif'],
      serif: ['Butler', 'serif'],
      romelio: ['Romelio', 'sans-serif'],
    },
    
    // Font sizes (mobile-first, optimized for elderly)
    sizes: {
      xs: '14px',      // Minimum readable size
      sm: '16px',      // Small labels
      base: '18px',    // Elder body (caregiver 16px)
      lg: '22px',      // Large body
      xl: '24px',      // Subheadings
      '2xl': '28px',   // Buttons
      '3xl': '32px',   // Section headers
      '4xl': '36px',   // Page subtitles
      '5xl': '48px',   // Page titles
      '6xl': '56px',   // Hero text
    },
    
    // Font weights
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    
    // Line heights (increased for readability)
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2,
    },
    
    // Letter spacing
    letterSpacing: {
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
    },
  },

  // Spacing Scale
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },

  // Border Radius
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    full: '9999px',
  },

  // Flat: no shadows except overlays
  shadows: { overlay: '0 12px 40px -12px rgba(27, 42, 36, 0.28)' },

  // Touch Targets (minimum 48x48px)
  touchTargets: {
    minimum: '48px',
    comfortable: '56px',
    large: '64px',
  },

  // Transitions
  transitions: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },

  // Accessibility
  accessibility: {
    // Minimum contrast ratios
    contrast: {
      aa: 4.5,      // WCAG AA
      aaa: 7,       // WCAG AAA
    },
    
    // Focus visible styles
    focus: {
      outline: '2px solid #1F5F4A',
      offset: '2px',
    },
  },
}

// Helper function to access theme values
export const getThemeValue = (path) => {
  return path.split('.').reduce((obj, key) => obj?.[key], theme)
}

export default theme
