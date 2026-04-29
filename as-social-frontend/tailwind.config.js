/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          400: '#BFB3A6',
          500: '#A68B7D',
        },
        bg: {
          base:   '#F2EDE4',
          card:   '#FFFFFF',
          sidebar:'#3A443A',
          hover:  '#2E352E',
          border: 'rgba(58,68,58,0.10)',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body:    ['Heebo', 'sans-serif'],
        mono:    ['Heebo', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 2px 18px rgba(58,68,58,0.07)',
      },
    },
  },
  plugins: [],
}