/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FAF9F6",
        ink: "#1A1A18",
        terracotta: {
          DEFAULT: "#C1502E",
          light: "#E0825F",
          dark: "#8F3A1F",
        },
        sage: "#5C7A5E",
        mute: "#8A8578",
      },
      fontFamily: {
        display: ["var(--font-source-serif)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
