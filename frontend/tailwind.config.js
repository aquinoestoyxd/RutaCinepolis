/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#e31837', dark: '#b5122b', light: '#ff4d6d' },
        navy:    { DEFAULT: '#1a1a2e', light: '#2d2d44' },
        golden:  { DEFAULT: '#FFD700', dark: '#e6c200' },
      },
    },
  },
  plugins: [],
}
