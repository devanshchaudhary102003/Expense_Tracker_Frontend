/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eefdf6',
          100: '#d6f9e7',
          200: '#aff1cf',
          300: '#7ce4b1',
          400: '#46cf8e',
          500: '#1fb573',
          600: '#13935c',
          700: '#11754b',
          800: '#125c3d',
          900: '#104b34',
          950: '#06291c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 4px 16px -2px rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [],
};
