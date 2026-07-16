/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5ebe0',
          100: '#ece0d0',
          200: '#e0d0b8',
          300: '#d4c0a0',
          400: '#d4a574',
          500: '#c49464',
          600: '#b8845a',
          700: '#a8744a',
          800: '#8a6040',
          900: '#6b4c30',
          950: '#4d3820',
        },
        dark: {
          50: '#f0e8dc',
          100: '#e0d4c8',
          200: '#d0c4b4',
          300: '#c0b0a0',
          400: '#a09080',
          500: '#8a7a6a',
          600: '#6b5b4e',
          700: '#4d4038',
          800: '#342a24',
          900: '#2d3436',
          950: '#1a1c1d',
        },
        success: {
          50: '#f0f7f0',
          100: '#dcefdc',
          200: '#b8dfb8',
          300: '#8dcf8d',
          400: '#7dab7d',
          500: '#6d9b6d',
          600: '#5d8b5d',
        },
        danger: {
          50: '#f8e8e8',
          100: '#f0d0d0',
          200: '#e0b0b0',
          300: '#d09090',
          400: '#c47a7a',
          500: '#b06a6a',
          600: '#9c5a5a',
        },
        warning: {
          50: '#fff8f0',
          100: '#fef0dc',
          200: '#fce0b8',
          300: '#fad094',
          400: '#e0b060',
          500: '#d0a050',
          600: '#c09040',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'clay': '8px 8px 16px #d4c4b4, -8px -8px 16px #fff5ea',
        'clay-sm': '4px 4px 8px #d4c4b4, -4px -4px 8px #fff5ea',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
