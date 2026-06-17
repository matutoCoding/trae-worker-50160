/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f5fa',
          100: '#dae5f0',
          200: '#b8cce2',
          300: '#8dacce',
          400: '#5c87b6',
          500: '#3c6a9c',
          600: '#2c5282',
          700: '#264469',
          800: '#1e3a5f',
          900: '#1a304e',
          950: '#0f1e31',
        },
        gold: {
          50: '#fdf8e8',
          100: '#faefc6',
          200: '#f5df8e',
          300: '#eec94e',
          400: '#e6b424',
          500: '#d4af37',
          600: '#b88f2a',
          700: '#966a24',
          800: '#7a5424',
          900: '#674522',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'glow-gold': '0 0 20px rgba(212, 175, 55, 0.3)',
        'glow-rose': '0 0 20px rgba(225, 29, 72, 0.3)',
      },
      animation: {
        'pulse-soft': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
