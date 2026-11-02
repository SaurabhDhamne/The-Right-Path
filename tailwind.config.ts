import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { ink: "#0F2A4A", navy: "#17365D", brand: "#F5B921", paper: "#F2F5F9", mist: "#B7C4D6" },
      fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"], display: ["var(--font-display)", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
