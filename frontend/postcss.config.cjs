// POSTCSS CONFIG (NEW/CORRECT)
module.exports = {
  plugins: [
    require('@tailwindcss/postcss'), // <-- Use the new package name
    require('autoprefixer'),
  ],
};