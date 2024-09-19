/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/index.html", "./src/main.js"],
  theme: {
    extend: {},
  },
  safelist: [
    'text-xs',
    'text-sm',
    'text-lg',
    'text-xl',
    'text-2xl',
    'text-3xl',
  ],
  plugins: [],
}
