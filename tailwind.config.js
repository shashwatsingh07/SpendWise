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
      boxShadow: {
        glow: '0 10px 30px -5px rgba(124, 58, 237, 0.25)',
      },
      animation: {
        'slide-up': 'slideUp 0.25s ease-out both',
        'fade-in': 'fadeIn 0.2s ease-out both',
        'page-enter': 'pageEnter 0.4s ease-out both',
        'stagger-in': 'staggerIn 0.5s ease-out both',
        'modal-in': 'modalIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) both',
        'overlay-in': 'overlayIn 0.2s ease-out both',
      },
      keyframes: {
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
