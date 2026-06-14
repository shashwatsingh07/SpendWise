/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Violet → indigo brand ramp (replaces the old flat sky scheme)
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#7c3aed', // brand start
          600: '#6d28d9',
          700: '#5b21b6',
        },
        accent: {
          500: '#4f46e5', // indigo brand end
          600: '#4338ca',
        },
        surface: {
          DEFAULT: '#ffffff',
          dark: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        neon: {
          cyan: '#22d3ee',
          violet: '#a78bfa',
          fuchsia: '#e879f9',
        },
      },
      boxShadow: {
        glow: '0 10px 30px -5px rgba(124, 58, 237, 0.25)',
        'glow-lg': '0 20px 50px -10px rgba(124, 58, 237, 0.45)',
        'glow-emerald': '0 14px 40px -8px rgba(16, 185, 129, 0.45)',
        'glow-rose': '0 14px 40px -8px rgba(244, 63, 94, 0.45)',
        // crisp frosted-glass elevation for dark surfaces
        glass: '0 8px 32px -8px rgba(2, 6, 23, 0.6), inset 0 1px 0 0 rgba(255,255,255,0.06)',
      },
      animation: {
        'slide-up': 'slideUp 0.25s ease-out both',
        'fade-in': 'fadeIn 0.2s ease-out both',
        'page-enter': 'pageEnter 0.4s ease-out both',
        'stagger-in': 'staggerIn 0.5s ease-out both',
        'modal-in': 'modalIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) both',
        'overlay-in': 'overlayIn 0.2s ease-out both',
        shimmer: 'shimmer 2.2s linear infinite',
        float: 'float 7s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2.6s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(2%, -3%) scale(1.05)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 0.85 },
          '50%': { opacity: 1 },
        },
        slideUp: {
          from: { transform: 'translateY(10px)', opacity: 0 },
          to: { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        pageEnter: {
          from: { opacity: 0, transform: 'translateY(16px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        staggerIn: {
          from: { opacity: 0, transform: 'translateY(12px) scale(0.98)' },
          to: { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
        modalIn: {
          from: { opacity: 0, transform: 'scale(0.92) translateY(8px)' },
          to: { opacity: 1, transform: 'scale(1) translateY(0)' },
        },
        overlayIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}
