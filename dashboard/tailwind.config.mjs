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
        "inverse-primary": "#6052a5",
        "on-primary-container": "#bcafff",
        "on-secondary-fixed": "#112000",
        "surface-variant": "#353535",
        "surface-bright": "#393939",
        "inverse-surface": "#e5e2e1",
        "tertiary-fixed": "#ffdcc3",
        "on-error": "#690005",
        "surface-container": "#20201f",
        "tertiary-container": "#723c00",
        "primary-fixed-dim": "#c9beff",
        "on-background": "#e5e2e1",
        "secondary-container": "#a3fa00",
        "inverse-on-surface": "#313030",
        "surface-dim": "#131313",
        "on-secondary-fixed-variant": "#304f00",
        "on-surface": "#e5e2e1",
        "on-secondary-container": "#467000",
        "tertiary": "#ffb77d",
        "surface-container-high": "#2a2a2a",
        "on-primary-fixed-variant": "#483a8c",
        "outline-variant": "#484551",
        "on-secondary": "#203600",
        "on-primary-fixed": "#1b035f",
        "on-tertiary-fixed": "#2f1500",
        "on-tertiary": "#4d2600",
        "secondary": "#ffffff",
        "primary": "#c9beff",
        "tertiary-fixed-dim": "#ffb77d",
        "error": "#ffb4ab",
        "secondary-fixed": "#a3fa00",
        "primary-fixed": "#e6deff",
        "primary-container": "#4b3d8f",
        "background": "#131313",
        "error-container": "#93000a",
        "surface-container-lowest": "#0e0e0e",
        "on-error-container": "#ffdad6",
        "on-primary": "#312174",
        "surface-tint": "#c9beff",
        "outline": "#938f9c",
        "surface-container-low": "#1c1b1b",
        "secondary-fixed-dim": "#8edb00",
        "surface-container-highest": "#353535",
        "surface": "#131313",
        "on-tertiary-container": "#ffa556",
        "on-tertiary-fixed-variant": "#6e3900",
        "on-surface-variant": "#c9c4d2"
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
