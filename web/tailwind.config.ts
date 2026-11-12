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
        desk: {
          bg: "#0B0E13",
          header: "#0E1218",
          card: "#121821",
          raised: "#18202B",
          border: "#1E2733",
          borderStrong: "#253041",
          text: "#E8ECF1",
          secondary: "#A3AEBC",
          tertiary: "#8792A2",
          accent: "#6CB4FF",
          caution: "#F2B24C",
          cautionText: "#F5CB82",
          risk: "#FF8B5C",
          riskText: "#FFB89A",
        },
        bg: {
          canvas: "#0B0E13",
          card: "#121821",
          raised: "#18202B",
          hover: "#1D2736",
        },
        border: {
          subtle: "#1E2733",
          strong: "#253041",
        },
        text: {
          primary: "#E8ECF1",
          secondary: "#A3AEBC",
          muted: "#8792A2",
        },
        accent: {
          favorable: "#6CB4FF",
          caution: "#F2B24C",
          risk: "#FF8B5C",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      borderRadius: {
        control: "8px",
        card: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
