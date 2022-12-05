/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors')

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        primary: {
          bright: colors.slate[200],
          dark: colors.slate[900],
        },
        secondary: {
          bright: colors.emerald[500],
          dark: colors.emerald[900],
        },
        highlight: {
          bright: colors.yellow[300],
          dark: colors.yellow[600],
        },
      },
    },
  },
  darkMode: 'class',
  plugins: [require('@tailwindcss/line-clamp')],
}
