import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-dm-serif)", "serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
      },
      colors: {
        background: "var(--bg)",
        foreground: "var(--text)",
      },
    },
  },
  plugins: [],
};
export default config;
