/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        "on-primary-container": "#003430",
        "tertiary-container": "#9394a4",
        tertiary: "#c5c5d6",
        "on-tertiary-fixed": "#191b27",
        "on-surface-variant": "#bcc9c6",
        "secondary-fixed": "#ffdad7",
        "primary-container": "#26a69a",
        "on-error-container": "#ffdad6",
        "outline-variant": "#3d4947",
        "tertiary-fixed-dim": "#c5c5d6",
        "surface-container": "#1b1f2b",
        "primary-fixed-dim": "#66d9cc",
        "on-primary-fixed": "#00201d",
        "tertiary-fixed": "#e1e1f3",
        "on-primary": "#003732",
        "on-background": "#dfe2f2",
        primary: "#66d9cc",
        "surface-dim": "#0f131e",
        "on-secondary-fixed": "#410004",
        "inverse-primary": "#006a62",
        "on-tertiary-fixed-variant": "#444654",
        "on-secondary": "#68000b",
        error: "#ffb4ab",
        "on-tertiary-container": "#2b2d3a",
        secondary: "#ffb3ae",
        "secondary-container": "#910816",
        "surface-container-low": "#171b26",
        "inverse-on-surface": "#2c303c",
        "surface-tint": "#66d9cc",
        outline: "#869391",
        "on-secondary-container": "#ff9992",
        "surface-bright": "#353945",
        surface: "#0f131e",
        "on-secondary-fixed-variant": "#910816",
        "on-primary-fixed-variant": "#005049",
        "surface-container-highest": "#313441",
        background: "#0f131e",
        "primary-fixed": "#84f5e8",
        "surface-variant": "#313441",
        "surface-container-high": "#262a35",
        "secondary-fixed-dim": "#ffb3ae",
        "surface-container-lowest": "#0a0e19",
        "inverse-surface": "#dfe2f2",
        "on-tertiary": "#2e303d",
        "on-surface": "#dfe2f2",
        "on-error": "#690005",
        "error-container": "#93000a",
      },
      fontFamily: {
        headline: ["Inter"],
        body: ["Inter"],
        label: ["Inter"],
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem",
      },
      animation: {
        // Override the default pulse animation properties (duration, easing, etc.)
        'pulse': 'customPulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        // Define your custom keyframes
        customPulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' }, // Fully opaque, original size
          '50%': { opacity: '0.4', transform: 'scale(0.9)' }, // More transparent, smaller size
        }
      }

    },
  },
  plugins: [],
}
