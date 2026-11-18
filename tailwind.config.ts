import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#7A1F2B", // Deep crimson
          hover: "#5E1520",   // Darker hover
          dark: "#3D0C14",    // Dark burgundy
        },
        ivory: {
          DEFAULT: "#FAF5EA", // 60% warm cream bg
          secondary: "#F3EBDA", // Secondary section bg
        },
        surface: "#FFFFFF",   // 25% white cards/modals
        ink: {
          primary: "#2A1A1D",  // Deep charcoal/plum text
          secondary: "#6B5559", // Muted warm text
        },
        warmborder: "#E6DBC8",
        success: {
          DEFAULT: "#2E6B47",
          bg: "#EAF5EE",
          border: "#BCE3CB",
        },
        danger: {
          DEFAULT: "#A83232",
          bg: "#FDF0F0",
          border: "#F5C2C2",
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', "Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ['"DM Sans"', "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 8px -2px rgba(61, 12, 20, 0.05), 0 1px 3px -1px rgba(61, 12, 20, 0.04)",
        cardHover: "0 12px 24px -6px rgba(122, 31, 43, 0.12), 0 4px 10px -2px rgba(61, 12, 20, 0.06)",
        modal: "0 24px 48px -12px rgba(61, 12, 20, 0.25)",
      },
      transitionDuration: {
        DEFAULT: "180ms",
      },
    },
  },
  plugins: [],
};

export default config;
