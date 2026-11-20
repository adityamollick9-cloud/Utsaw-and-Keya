/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fbf8f4',
          100: '#f5eee3',
          200: '#eadbc6',
          300: '#dec2a2',
          400: '#cfa47b',
          500: '#b88656',
          600: '#9e6d42',
          700: '#7e5234',
          800: '#67422d',
          900: '#553728',
        }
      }
    },
  },
  plugins: [],
}

