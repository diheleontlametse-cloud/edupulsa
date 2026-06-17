/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          900: '#0F3D3E',
          800: '#1A5F5F',
          700: '#2D8A8A',
          600: '#3AAFA9',
          50: '#E6F5F4',
        },
        sand: {
          100: '#F5F0E8',
          200: '#EDE6DA',
          300: '#DDD3C4',
        },
        gold: {
          500: '#D4A843',
          100: '#FDF6E3',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
