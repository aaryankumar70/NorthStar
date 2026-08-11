/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        coral: {
          50: '#fff5f3',
          100: '#ffe8e3',
          200: '#ffd0c5',
          300: '#ffb0a0',
          400: '#ff8a72',
          500: '#ff6b50',
          600: '#ed4e38',
          700: '#c93d2c',
          800: '#a53427',
          900: '#872f25',
        },
      },
    },
  },
  plugins: [],
};
