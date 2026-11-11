/** @type {import('tailwindcss').Config} */
const green = {
    50: '#F1F7F3', 100: '#E3EEE7', 200: '#C4DBCE', 300: '#98BEA9', 400: '#5F9680',
    500: '#2F7860', 600: '#1F5F4A', 700: '#174A3A', 800: '#113A2D', 900: '#0B2A20',
}

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
                serif: ['Butler', '"Noto Serif Devanagari"', 'Georgia', 'serif'],
                sans: ['"Atkinson Hyperlegible"', '"Noto Sans Devanagari"', 'system-ui', 'sans-serif'],
                romelio: ['Romelio', 'sans-serif'],
            },
            // Palette: paper + ink + forest green, saffron/terracotta as sparing warm accents.
            // Legacy names (primary, sage, cream, clay) keep working; sage = ink neutrals, cream = paper neutrals.
            colors: {
                paper: { DEFAULT: '#FAF6EE', 2: '#F2ECDF' },
                ink: { DEFAULT: '#1B2A24', 2: '#4B5B53' },
                line: '#E3DCCB',
                saffron: { DEFAULT: '#E8A33D', light: '#FBEFD6', dark: '#8A5A0E' },
                primary: {
                    DEFAULT: '#1F5F4A',
                    light: '#98BEA9',
                    dark: '#174A3A',
                    bg: '#E3EEE7',
                    ...green,
                },
                secondary: { DEFAULT: '#FAF6EE', dark: '#F2ECDF' },
                accent: { DEFAULT: '#B3261E', light: '#FBEBE9' },
                sage: {
                    50: '#F6F1E6', 100: '#F2ECDF', 200: '#E3DCCB', 300: '#CFC6B0', 400: '#66726B',
                    500: '#5A6860', 600: '#4B5B53', 700: '#38463F', 800: '#27352F', 900: '#1B2A24',
                },
                cream: {
                    50: '#FAF6EE', 100: '#F2ECDF', 200: '#E8E0CE', 300: '#D9D0BB', 400: '#BDB296',
                    500: '#968C74', 600: '#70685A', 700: '#52493F', 800: '#38322B', 900: '#26221D',
                },
                clay: {
                    DEFAULT: '#C8643C', light: '#F8E6DC', dark: '#A24E2B',
                    50: '#FBF0EA', 100: '#F8E6DC', 200: '#F0CDB8', 300: '#E5A987', 400: '#D88560',
                    500: '#C8643C', 600: '#A24E2B', 700: '#7E3C21', 800: '#5C2C18', 900: '#3D1D10',
                },
                status: { success: '#2E7D4F', warning: '#B87A1B', danger: '#B3261E', info: '#1F5F4A' },
                rose: { 50: '#FBEBE9', 100: '#F6D5D2', 200: '#EEB4AF', 400: '#D2645B', 500: '#C0392F', 600: '#B3261E', 700: '#911D17', 800: '#6E1511' },
                emerald: { 50: '#EAF4EE', 100: '#D5E9DD', 200: '#B0D4BE', 600: '#2E7D4F', 700: '#256640', 800: '#1D5233' },
                amber: { 50: '#FDF5E4', 100: '#FBEBC8', 200: '#F4D79B', 600: '#B87A1B', 700: '#946010', 800: '#6F480C' },
                // No blue or violet in this product: any stray use resolves to the green scale.
                blue: green, indigo: green, violet: green, purple: green, sky: green, fuchsia: green,
            },
            fontSize: {
                xs: ['0.875rem', { lineHeight: '1.5' }],
                sm: ['1rem', { lineHeight: '1.5' }],
                base: ['1.125rem', { lineHeight: '1.55' }],
                lg: ['1.25rem', { lineHeight: '1.5' }],
                xl: ['1.375rem', { lineHeight: '1.45' }],
                '2xl': ['clamp(1.375rem, 1.15rem + 1vw, 1.625rem)', { lineHeight: '1.3' }],
                '3xl': ['clamp(1.625rem, 1.3rem + 1.4vw, 2rem)', { lineHeight: '1.2', letterSpacing: '-0.015em' }],
                '4xl': ['clamp(1.875rem, 1.4rem + 2vw, 2.5rem)', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
                '5xl': ['clamp(2rem, 1.2rem + 4vw, 3.5rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
                '6xl': ['clamp(2.25rem, 1.4rem + 5vw, 4.25rem)', { lineHeight: '1.05', letterSpacing: '-0.025em' }],
            },
            // Flat by design: only overlays (sheets, dialogs) keep a shadow.
            boxShadow: {
                soft: 'none', card: 'none', 'card-hover': 'none', 'glow-sage': 'none', 'glow-cream': 'none',
                elevated: '0 12px 40px -12px rgba(27, 42, 36, 0.28)',
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
                'gradient-sage': 'linear-gradient(#1F5F4A, #1F5F4A)',
                'gradient-cream': 'linear-gradient(#FAF6EE, #FAF6EE)',
                'gradient-soft': 'linear-gradient(#E3EEE7, #E3EEE7)',
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
