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
                serif: ['Butler', 'Georgia', 'serif'],
                sans: ['"Atkinson Hyperlegible"', 'system-ui', 'sans-serif'],
                romelio: ['Romelio', 'sans-serif'],
            },
            // Simplified color palette - only 2-3 colors optimized for elderly users
            colors: {
                // One accent (blue), ink neutrals, warm paper. Status colours are for status only.
                primary: {
                    DEFAULT: '#2F5BEA',
                    light: '#8FA8F5',
                    dark: '#1E3FAE',
                    bg: '#E9EEFD',
                },
                secondary: {
                    DEFAULT: '#FBF7F0',
                    dark: '#EBE2D0',
                },
                accent: {
                    DEFAULT: '#C2362B',
                    light: '#FBE9E7',
                },
                // Legacy names kept so existing pages inherit the new palette.
                // sage = ink neutrals (text, borders, dark buttons)
                sage: {
                    50: '#F8F5EF',
                    100: '#F1ECE2',
                    200: '#E6DFD1',
                    300: '#D3CBBA',
                    400: '#7D7566',
                    500: '#6A6355',
                    600: '#524C40',
                    700: '#3A352C',
                    800: '#27231D',
                    900: '#1A1713',
                },
                // cream = warm paper surfaces
                cream: {
                    50: '#FBF7F0',
                    100: '#F5EEE1',
                    200: '#EBE2D0',
                    300: '#DDD1BA',
                    400: '#BDB19A',
                    500: '#948976',
                    600: '#70675A',
                    700: '#52493F',
                    800: '#38322B',
                    900: '#26221D',
                },
                // Warm secondary: terracotta. Sparing use: accents, highlights, illustrations.
                clay: {
                    DEFAULT: '#B5522F',
                    light: '#F7E4D9',
                    dark: '#8C3E22',
                },
                status: {
                    success: '#1E7F5C',
                    warning: '#B7791F',
                    danger: '#C2362B',
                    info: '#2F5BEA',
                },
                rose: {
                    50: '#FBE9E7',
                    500: '#C2362B',
                    600: '#A82D23',
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
                // Warm, low, wide shadows: brown-tinted so they read as paper, not plastic
                'soft': '0 1px 2px rgba(74, 52, 28, 0.06), 0 6px 18px -10px rgba(74, 52, 28, 0.14)',
                'elevated': '0 2px 4px rgba(74, 52, 28, 0.06), 0 18px 40px -18px rgba(74, 52, 28, 0.22)',
                'glow-sage': '0 0 0 4px rgba(47, 91, 234, 0.15)',
                'glow-cream': '0 0 0 4px rgba(235, 226, 208, 0.6)',
                'card': '0 1px 2px rgba(74, 52, 28, 0.06), 0 6px 18px -10px rgba(74, 52, 28, 0.14)',
                'card-hover': '0 2px 4px rgba(74, 52, 28, 0.06), 0 14px 30px -14px rgba(74, 52, 28, 0.22)',
            },
            borderRadius: {
                // Tighter than Tailwind defaults: cleaner, less bubbly
                'xl': '0.75rem',
                '2xl': '1rem',
                '3xl': '1.25rem',
                '4xl': '1.75rem',
                '5xl': '2rem',
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
                'gradient-sage': 'linear-gradient(135deg, #2F5BEA 0%, #1E3FAE 100%)',
                'gradient-cream': 'linear-gradient(135deg, #FBF7F0 0%, #F5EEE1 100%)',
                'gradient-soft': 'linear-gradient(135deg, #E9EEFD 0%, #F5EEE1 100%)',
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
