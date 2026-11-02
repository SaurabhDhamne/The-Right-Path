import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { ink: "#02264A", navy: "#05355D", brand: "#FDB620", paper: "#F2F5F9", mist: "#B7C4D6" },
      fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"], display: ["var(--font-display)", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;