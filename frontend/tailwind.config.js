module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      zIndex: {
        '-1': '-1'
      }
    }
  },
  variants: {
    extend: {}
  },
  plugins: [require('@tailwindcss/line-clamp')]
};
