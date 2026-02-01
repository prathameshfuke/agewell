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
  // Simplified Color Palette
  colors: {
    // Primary - Sage Green (calming, trustworthy)
    primary: {
      main: '#5C7A6E',      // Main sage green - high contrast
      light: '#9BB5A5',     // Light sage - backgrounds
      dark: '#3A4E46',      // Dark sage - text
      bg: '#E8F0EB',        // Very light sage for subtle backgrounds
    },
    
    // Secondary - Warm Cream (comfortable, accessible)
    secondary: {
      main: '#FAF8F5',      // Cream background
      dark: '#C9B9A4',      // Cream border/divider
      text: '#665D52',      // Cream text for subtle info
    },
    
    // Accent - Emergency Red (alerts only)
    accent: {
      main: '#EF4444',      // Emergency red
      light: '#FEE2E2',     // Light red background
    },
    
    // Status Colors (clear communication)
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      info: '#3B82F6',
    }
  },

  // Typography Scale - Big & Bold for Elderly Users
  typography: {
    // Font families
    fonts: {
      sans: ['Poppins', 'sans-serif'],
      serif: ['Butler', 'serif'],
      romelio: ['Romelio', 'sans-serif'],
    },
    
    // Font sizes (mobile-first, optimized for elderly)
    sizes: {
      xs: '14px',      // Minimum readable size
      sm: '16px',      // Small labels
      base: '20px',    // Body text (was 16px)
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

  // Shadows (soft and elevated)
  shadows: {
    soft: '0 4px 20px rgba(92, 122, 110, 0.08)',
    elevated: '0 8px 30px rgba(92, 122, 110, 0.12)',
    card: '0 2px 12px rgba(0, 0, 0, 0.04)',
    cardHover: '0 8px 24px rgba(92, 122, 110, 0.15)',
  },

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
      outline: '3px solid #5C7A6E',
      offset: '2px',
    },
  },
}

// Helper function to access theme values
export const getThemeValue = (path) => {
  return path.split('.').reduce((obj, key) => obj?.[key], theme)
}

export default theme
