// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Make sure this covers App.jsx
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}