/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/views/*.{vue,js,ts,jsx,tsx}",
    "./src/components/**/*.{vue,js,ts,jsx,tsx}",
    "./src/App.vue"
  ],
  theme: {
    extend: {}
  },
  plugins: []
};
