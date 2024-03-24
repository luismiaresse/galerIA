/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/index.html",
    "./app/views/*.{vue,js,ts,jsx,tsx}",
    "./app/components/*.{vue,js,ts,jsx,tsx}",
    "./app/App.vue",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

