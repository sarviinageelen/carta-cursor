import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#ffffff",
        canvas: "#f6f7f9",
        ink: "#111418",
        muted: "#5b6470",
        line: "#e4e7eb",
        accent: "#2f5bea",
        positive: "#0f7a4d",
        negative: "#b4231f",
        warning: "#9a6a00",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      fontSize: {
        title: ["24px", { lineHeight: "30px", fontWeight: "600" }],
      },
    },
  },
  plugins: [],
};

export default config;
