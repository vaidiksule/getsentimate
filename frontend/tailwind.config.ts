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
        sans: "SF Pro Display",
      },
      borderRadius: {
        '4xl': "2rem",
      },
      boxShadow: {
        DEFAULT: "0 2px 4px rgba(0, 0, 0, 0.1)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
      },
      colors: {
        primary: "#007AFF",
        secondary: "#8E8E93",
        accent: "#FF453A",
        background: "#F2F2F7",
        text: "#000000",
        lightText: "#8E8E93",
      },
    },
  },
  plugins: [],
};
export default config;