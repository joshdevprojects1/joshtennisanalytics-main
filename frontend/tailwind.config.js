/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Chart-brand-aligned palette (mirrors src/charts.py)
        bg: "#F4F1EA",
        ink: "#1F1B16",
        muted: "#7A736A",
        grid: "#D9D2C5",
        clay: "#C2410C",
        hard: "#1E40AF",
        grass: "#15803D",
        neutral: "#9CA3AF",
      },
      fontFamily: {
        display: ['"Fraunces"', "ui-serif", "Georgia", "serif"],
        body: ['"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
    },
  },
  plugins: [],
};
