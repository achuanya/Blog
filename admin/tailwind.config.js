/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./public/**/*.html",
    "./public/**/*.js",
    "./src/**/*.js",
    "./src/styles/**/*.{css,scss}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#2a7db8"
        }
      },
      boxShadow: {
        card: "0 4px 20px rgba(0,0,0,0.08)"
      }
    }
  },
  plugins: []
}