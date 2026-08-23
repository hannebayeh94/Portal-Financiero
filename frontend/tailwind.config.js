import flow from '../packages/design-tokens/index.js'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tokens Flujo (nativos)
        paper: flow.colors.paper,
        card: flow.colors.card,
        mist: {
          DEFAULT: flow.colors.mist,
          soft: flow.colors.mistSoft,
        },
        ink: {
          DEFAULT: flow.colors.ink,
          soft: flow.colors.inkSoft,
          muted: flow.colors.inkMuted,
          faint: flow.colors.inkFaint,
        },
        water: flow.colors.water,
        coral: flow.colors.coral,
        amber2: flow.colors.amber,

        // Aliases de transición: el tema oscuro anterior remapeado a Flujo
        primary: {
          50: '#E3F1F1',
          100: '#C9E4E5',
          200: '#9DD0D3',
          300: '#5FB8BC',
          400: '#35A0A6',
          500: '#1B8A8F',
          600: '#14666B',
          700: '#104F53',
        },
        dark: {
          50: '#FBFAF7',
          100: '#F1EDE3',
          200: '#E4DFD1',
          300: '#CFC7B2',
          400: '#A3B5B2',
          500: '#6E8884',
          600: '#55716D',
          700: '#37544F',
          800: '#123332',
          900: '#0E2928',
          950: '#091E1D',
        },
        success: {
          50: '#E8F4E5',
          100: '#D3E8CD',
          200: '#A9D3A0',
          300: '#7FBE73',
          400: '#5FA052',
          500: '#4A8541',
          600: '#3A6A34',
        },
        danger: {
          50: '#FBEAE5',
          100: '#F6D5CB',
          200: '#F0AB99',
          300: '#F09A85',
          400: '#EA7E63',
          500: '#E86A4E',
          600: '#C24E36',
        },
        warning: {
          50: '#FAF0DE',
          100: '#F4E1C0',
          200: '#EDCD96',
          300: '#F2C57E',
          400: '#ECB05A',
          500: '#E9A13B',
          600: '#C07D22',
        },
        purple: {
          500: '#8A7BC8',
          600: '#7466B0',
        },
        emerald: {
          500: '#4A8541',
          600: '#3A6A34',
        },
        rose: {
          400: '#EA7E63',
          500: '#E86A4E',
          600: '#C24E36',
        },
        green: {
          500: '#4A8541',
          600: '#3A6A34',
        },
        gray: {
          300: '#CFC7B2',
          400: '#A3B5B2',
          500: '#6E8884',
          600: '#55716D',
          700: '#37544F',
          800: '#123332',
          900: '#0E2928',
        },
      },
      fontFamily: {
        sans: ['"Instrument Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Bricolage Grotesque"', '"Instrument Sans"', 'sans-serif'],
        mono: ['"Spline Sans Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'flow-sm': '0 1px 2px rgba(18,51,50,0.06), 0 4px 12px -6px rgba(18,51,50,0.10)',
        flow: '0 2px 4px rgba(18,51,50,0.05), 0 12px 28px -12px rgba(18,51,50,0.14)',
        'flow-lg': '0 4px 8px rgba(18,51,50,0.05), 0 24px 48px -20px rgba(18,51,50,0.20)',
      },
      borderRadius: {
        'flow': '1rem',
        'flow-lg': '1.5rem',
      },
    },
  },
  plugins: [],
}
