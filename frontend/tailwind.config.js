/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        // Mobile-first breakpoints (Tailwind default)
        screens: {
            'xs': '360px',  // Small phones
            'sm': '640px',  // Mobile landscape / small tablets
            'md': '768px',  // Tablets
            'lg': '1024px', // Desktop
            'xl': '1280px', // Large desktop
        },
        extend: {
            fontFamily: {
                serif: ['Butler', 'serif'],
                sans: ['Poppins', 'sans-serif'],
                romelio: ['Romelio', 'sans-serif'],
            },
            // Simplified color palette - only 2-3 colors optimized for elderly users
            colors: {
                // Primary - Sage Green (simplified to 3 levels)
                primary: {
                    DEFAULT: '#5C7A6E',  // Main sage green
                    light: '#9BB5A5',    // Light sage
                    dark: '#3A4E46',     // Dark sage
                    bg: '#E8F0EB',       // Very light background
                },
                // Secondary - Warm Cream (simplified to 2 levels)
                secondary: {
                    DEFAULT: '#FAF8F5',  // Cream background
                    dark: '#C9B9A4',     // Cream border
                },
                // Accent - Emergency Red (single color)
                accent: {
                    DEFAULT: '#EF4444',  // Emergency red
                    light: '#FEE2E2',    // Light red bg
                },
                // Legacy compatibility - map to simplified palette
                sage: {
                    50: '#E8F0EB',
                    100: '#E8F0EB',
                    200: '#9BB5A5',
                    300: '#9BB5A5',
                    400: '#9BB5A5',
                    500: '#5C7A6E',
                    600: '#5C7A6E',
                    700: '#3A4E46',
                    800: '#3A4E46',
                    900: '#3A4E46',
                },
                cream: {
                    50: '#FAF8F5',
                    100: '#FAF8F5',
                    200: '#C9B9A4',
                    300: '#C9B9A4',
                    400: '#C9B9A4',
                    500: '#C9B9A4',
                    600: '#C9B9A4',
                    700: '#C9B9A4',
                    800: '#665D52',
                    900: '#665D52',
                },
                // Status colors (clear communication)
                status: {
                    success: '#10B981',
                    warning: '#F59E0B',
                    danger: '#EF4444',
                    info: '#3B82F6',
                },
                rose: {
                    50: '#FEE2E2',
                    500: '#EF4444',
                    600: '#DC2626',
                }
            },
            // Increased font sizes for elderly users
            fontSize: {
                xs: ['14px', { lineHeight: '1.5', letterSpacing: '0.025em' }],
                sm: ['16px', { lineHeight: '1.5', letterSpacing: '0.025em' }],
                base: ['20px', { lineHeight: '1.5', letterSpacing: '0.025em' }],
                lg: ['22px', { lineHeight: '1.5', letterSpacing: '0.025em' }],
                xl: ['24px', { lineHeight: '1.5', letterSpacing: '0.025em' }],
                '2xl': ['28px', { lineHeight: '1.4', letterSpacing: '0' }],
                '3xl': ['32px', { lineHeight: '1.3', letterSpacing: '-0.025em' }],
                '4xl': ['36px', { lineHeight: '1.3', letterSpacing: '-0.025em' }],
                '5xl': ['48px', { lineHeight: '1.2', letterSpacing: '-0.025em' }],
                '6xl': ['56px', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
            },
            boxShadow: {
                'soft': '0 4px 20px rgba(124, 154, 142, 0.08)',
                'elevated': '0 8px 30px rgba(124, 154, 142, 0.12)',
                'glow-sage': '0 0 30px rgba(124, 154, 142, 0.2)',
                'glow-cream': '0 0 30px rgba(245, 237, 227, 0.5)',
                'card': '0 2px 12px rgba(0, 0, 0, 0.04)',
                'card-hover': '0 8px 24px rgba(124, 154, 142, 0.15)',
            },
            borderRadius: {
                '4xl': '2rem',
                '5xl': '2.5rem',
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'fade-in': 'fadeIn 0.4s ease-out',
                'slide-up': 'slideUp 0.4s ease-out',
                'slide-down': 'slideDown 0.4s ease-out',
                'scale-in': 'scaleIn 0.3s ease-out',
                'bounce-subtle': 'bounceSubtle 0.6s ease-out',
                'float': 'float 6s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.9)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                bounceSubtle: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-8px)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
                    '50%': { transform: 'translateY(-20px) rotate(5deg)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
            backgroundImage: {
                'gradient-sage': 'linear-gradient(135deg, #7C9A8E 0%, #5C7A6E 100%)',
                'gradient-cream': 'linear-gradient(135deg, #FAF8F5 0%, #F5EDE3 100%)',
                'gradient-soft': 'linear-gradient(135deg, #E8F0EB 0%, #F5EDE3 100%)',
            },
            // Mobile-first spacing utilities
            spacing: {
                'safe-bottom': 'max(1rem, env(safe-area-inset-bottom))',
                'safe-top': 'max(1rem, env(safe-area-inset-top))',
            },
            // Min heights for touch targets (elderly-friendly)
            minHeight: {
                'touch': '48px',
                'touch-lg': '56px',
            },
            minWidth: {
                'touch': '48px',
                'touch-lg': '56px',
            },
        },
    },
    plugins: [],
}
