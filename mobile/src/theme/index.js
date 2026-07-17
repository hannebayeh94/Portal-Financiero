export const colors = {
  primary: {
    50: '#f5ebe0', 100: '#ece0d0', 200: '#e0d0b8',
    300: '#d4c0a0', 400: '#d4a574', 500: '#c49464',
    600: '#b8845a', 700: '#a8744a', 800: '#8a6040',
    900: '#6b4c30',
  },
  dark: {
    50: '#f0e8dc', 100: '#e0d4c8', 200: '#d0c4b4',
    300: '#c0b0a0', 400: '#a09080', 500: '#8a7a6a',
    600: '#6b5b4e', 700: '#4d4038', 800: '#342a24',
    900: '#2d3436',
  },
  success: { 400: '#7dab7d', 500: '#6d9b6d', 600: '#5d8b5d' },
  danger: { 400: '#c47a7a', 500: '#b06a6a', 600: '#9c5a5a' },
  warning: { 400: '#e0b060', 500: '#d0a050', 600: '#c09040' },
  clay: {
    bg: '#f0e6d8',
    card: '#f5ebe0',
    accent: '#d4a574',
    warm: '#e8c4a0',
    green: '#7dab7d',
    red: '#c47a7a',
    text: '#2d3436',
    textMuted: '#8a7a6a',
    shadow: '#d4c4b4',
    highlight: '#fff5ea',
    inset: '#e8ddd0',
  },
}

export const shadows = {
  clay: {
    shadowColor: colors.clay.shadow,
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 10,
  },
  claySm: {
    shadowColor: colors.clay.shadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  clayInset: {
    shadowColor: colors.clay.shadow,
    shadowOffset: { width: -3, height: -3 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
}
