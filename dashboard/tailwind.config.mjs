/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "inverse-primary": "#701a75",
        "on-primary-container": "#f5f3ff",
        "on-secondary-fixed": "#ffffff",
        "surface-variant": "#1e1b29",
        "surface-bright": "#1a1625",
        "inverse-surface": "#ffffff",
        "tertiary-fixed": "#ffdcc3",
        "on-error": "#690005",
        "surface-container": "#0a0a0f",
        "tertiary-container": "#723c00",
        "primary-fixed-dim": "#d8b4fe",
        "on-background": "#ffffff",
        "secondary-container": "#be5eff",
        "inverse-on-surface": "#121214",
        "surface-dim": "#050508",
        "on-secondary-fixed-variant": "#3b0764",
        "on-surface": "#ffffff",
        "on-secondary-container": "#f5f3ff",
        "tertiary": "#ffb77d",
        "surface-container-high": "#12101a",
        "on-primary-fixed-variant": "#4c1d95",
        "outline-variant": "#2e2a3a",
        "on-secondary": "#ffffff",
        "on-primary-fixed": "#2e1065",
        "on-tertiary-fixed": "#2f1500",
        "on-tertiary": "#4d2600",
        "secondary": "#ffffff",
        "primary": "#c084fc",
        "tertiary-fixed-dim": "#ffb77d",
        "error": "#fca5a5",
        "secondary-fixed": "#d946ef",
        "primary-fixed": "#f3e8ff",
        "primary-container": "#3b0764",
        "background": "#000000",
        "error-container": "#991b1b",
        "surface-container-lowest": "#020203",
        "on-error-container": "#fee2e2",
        "on-primary": "#ffffff",
        "surface-tint": "#c084fc",
        "outline": "#6b7280",
        "surface-container-low": "#050508",
        "secondary-fixed-dim": "#be5eff",
        "surface-container-highest": "#1e1b29",
        "surface": "#000000",
        "on-tertiary-container": "#ffa556",
        "on-tertiary-fixed-variant": "#6e3900",
        "on-surface-variant": "#cbd5e1"
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      spacing: {
        "container-max": "1440px",
        "gutter": "16px",
        "margin-mobile": "16px",
        "unit": "4px",
        "margin-desktop": "32px"
      },
      fontFamily: {
        "headline-md": ["Hanken Grotesk"],
        "label-lg": ["Space Mono"],
        "data-num": ["Space Mono"],
        "body-lg": ["Hanken Grotesk"],
        "headline-sm": ["Hanken Grotesk"],
        "headline-lg": ["Hanken Grotesk"],
        "body-md": ["Hanken Grotesk"],
        "label-md": ["Space Mono"]
      },
      fontSize: {
        "headline-md": [
          "32px",
          {
            "lineHeight": "1.2",
            "letterSpacing": "-0.01em",
            "fontWeight": "700"
          }
        ],
        "label-lg": [
          "14px",
          {
            "lineHeight": "1.0",
            "fontWeight": "700"
          }
        ],
        "data-num": [
          "20px",
          {
            "lineHeight": "1.0",
            "fontWeight": "700"
          }
        ],
        "body-lg": [
          "18px",
          {
            "lineHeight": "1.6",
            "fontWeight": "400"
          }
        ],
        "headline-sm": [
          "24px",
          {
            "lineHeight": "1.2",
            "fontWeight": "700"
          }
        ],
        "headline-lg": [
          "48px",
          {
            "lineHeight": "1.1",
            "letterSpacing": "-0.02em",
            "fontWeight": "800"
          }
        ],
        "body-md": [
          "16px",
          {
            "lineHeight": "1.5",
            "fontWeight": "400"
          }
        ],
        "label-md": [
          "12px",
          {
            "lineHeight": "1.0",
            "fontWeight": "400"
          }
        ]
      }
    },
  },
  plugins: [],
};
