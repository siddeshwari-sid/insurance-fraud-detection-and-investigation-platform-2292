/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#3b82f6", // blue-500
          accent: "#06b6d4" // cyan-500
        }
      }
    }
  },
  plugins: []
};
