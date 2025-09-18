/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./public/**/*.html",
    "./public/**/*.js",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/styles/**/*.{css,scss}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#2a7db8"
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      transitionDuration: {
        '2000': '2000ms'
      },
      boxShadow: {
        card: "0 4px 20px rgba(0,0,0,0.08)"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
}