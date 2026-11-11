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
                    DEFAULT: '#FBFBF8',
                    dark: '#E9E8E1',
                },
                accent: {
                    DEFAULT: '#C2362B',
                    light: '#FBE9E7',
                },
                // Legacy names kept so existing pages inherit the new palette.
                // sage = ink neutrals (text, borders, dark buttons)
                sage: {
                    50: '#F6F7F9',
                    100: '#EEF0F4',
                    200: '#E1E4EA',
                    300: '#CDD1DA',
                    400: '#757C8C',
                    500: '#646B7B',
                    600: '#4B5161',
                    700: '#2E3340',
                    800: '#1E222B',
                    900: '#12141A',
                },
                // cream = warm paper surfaces
                cream: {
                    50: '#FBFBF8',
                    100: '#F5F5F0',
                    200: '#E9E8E1',
                    300: '#DAD9D0',
                    400: '#B9B7AB',
                    500: '#8F8D80',
                    600: '#6B695E',
                    700: '#4F4E45',
                    800: '#36352F',
                    900: '#24231F',
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
                'soft': '0 1px 2px rgba(18, 20, 26, 0.05)',
                'elevated': '0 8px 24px rgba(18, 20, 26, 0.08)',
                'glow-sage': '0 0 0 4px rgba(47, 91, 234, 0.15)',
                'glow-cream': '0 0 0 4px rgba(233, 232, 225, 0.6)',
                'card': '0 1px 2px rgba(18, 20, 26, 0.05)',
                'card-hover': '0 6px 20px rgba(18, 20, 26, 0.08)',
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
                'gradient-cream': 'linear-gradient(135deg, #FBFBF8 0%, #F5F5F0 100%)',
                'gradient-soft': 'linear-gradient(135deg, #E9EEFD 0%, #F5F5F0 100%)',
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
