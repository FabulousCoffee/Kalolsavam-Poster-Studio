/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Anek Malayalam"', "system-ui", "sans-serif"],
        display: ['"Cinzel"', '"Noto Serif Malayalam"', "serif"],
        anek: ['"Anek Malayalam"', "sans-serif"],
        notoserif: ['"Noto Serif Malayalam"', "serif"],
        ui: ['"Outfit"', '"Anek Malayalam"', "sans-serif"]
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" }
        }
      },
      animation: {
        float: "float 6.5s ease-in-out infinite"
      },
      colors: {
        obsidian: {
          950: "#040711",
          900: "#080E1E",
          850: "#0C142B",
          800: "#111C3B",
          700: "#1A2952"
        },
        kasavu: {
          300: "#FDE68A",
          400: "#F59E0B",
          500: "#D97706",
          600: "#B45309"
        },
        cyanGlow: "#00F2FE",
        violetGlow: "#8B5CF6"
      }
    }
  },
  plugins: []
};
