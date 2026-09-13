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
        // Tokens Nocturno (nativos)
        paper: flow.colors.paper,
        card: flow.colors.card,
        panel: flow.colors.panel,
        mist: {
          DEFAULT: flow.colors.mist,
          soft: flow.colors.mistSoft,
        },
        line: 'var(--line)',
        ink: {
          DEFAULT: flow.colors.ink,
          soft: flow.colors.inkSoft,
          muted: flow.colors.inkMuted,
          faint: flow.colors.inkFaint,
        },
        water: flow.colors.water,
        coral: flow.colors.coral,
        amber2: flow.colors.amber,
        gain: flow.colors.gain,
        loss: flow.colors.loss,
        warn: flow.colors.warn,

        // Escala oscura invertida: dark-900 = texto claro, dark-50 = superficie.
        // Así el código existente (text-dark-900, bg-dark-50, border-dark-100…)
        // se adapta solo al tema oscuro.
        dark: {
          50: '#10151F',
          100: '#161D2A',
          200: '#1E2837',
          300: '#2A3648',
          400: '#465468',
          500: '#6B7A8F',
          600: '#8794A8',
          700: '#A7B3C4',
          800: '#C2CCDA',
          900: '#E8EEF7',
          950: '#F5F8FC',
        },
        primary: {
          50: '#12182B',
          100: '#182146',
          200: '#233066',
          300: '#33478F',
          400: '#4E6AD6',
          500: '#6C8CFF',
          600: '#8FA8FF',
          700: '#B3C4FF',
        },
        success: {
          50: '#0D2A22',
          100: '#123A2E',
          200: '#1A5743',
          300: '#227A5D',
          400: '#2FB488',
          500: '#37D399',
          600: '#5FE0B0',
        },
        danger: {
          50: '#2A1416',
          100: '#3A1B1E',
          200: '#5A272B',
          300: '#8A3A3F',
          400: '#E05555',
          500: '#FF6B6B',
          600: '#FF8A8A',
        },
        warning: {
          50: '#2A2010',
          100: '#3A2C14',
          200: '#5C451D',
          300: '#8A6828',
          400: '#D9A23E',
          500: '#F5B84B',
          600: '#FFCE73',
        },
        purple: {
          500: '#B98CFF',
          600: '#CBA8FF',
        },
        emerald: {
          500: '#37D399',
          600: '#5FE0B0',
        },
        rose: {
          400: '#FF8A8A',
          500: '#FF6B6B',
          600: '#E04B4B',
        },
        green: {
          500: '#37D399',
          600: '#5FE0B0',
        },
        gray: {
          300: '#2A3648',
          400: '#465468',
          500: '#6B7A8F',
          600: '#8794A8',
          700: '#A7B3C4',
          800: '#C2CCDA',
          900: '#E8EEF7',
        },
      },
      fontFamily: {
        sans: ['"Manrope"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Sora"', '"Manrope"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'flow-sm': '0 1px 0 rgba(255,255,255,0.03), 0 6px 16px -10px rgba(0,0,0,0.7)',
        flow: '0 12px 32px -20px rgba(0,0,0,0.85)',
        'flow-lg': '0 28px 64px -32px rgba(0,0,0,0.9)',
      },
      borderRadius: {
        'flow': '0.875rem',
        'flow-lg': '1.25rem',
      },
    },
  },
  plugins: [],
}
