import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        base: "var(--color-base)",
        surface: "var(--color-surface)",
        elevated: "var(--color-elevated)",
        accent: "var(--color-accent)",
        "accent-hover": "var(--color-accent-hover)",
        "accent-muted": "var(--color-accent-muted)",
        fg: "var(--color-fg)",
        "fg-secondary": "var(--color-fg-secondary)",
        "fg-tertiary": "var(--color-fg-tertiary)",
        border: "var(--color-border)",
        "border-hover": "var(--color-border-hover)",
      },
    },
  },
  plugins: [],
};
export default config;
