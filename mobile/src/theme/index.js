export const colors = {
  primary: {
    50: '#f5ebe0', 100: '#ece0d0', 200: '#e0d0b8',
    300: '#d4c0a0', 400: '#d4a574', 500: '#c49464',
    600: '#b8845a', 700: '#a8744a',
  },
  dark: {
    50: '#f0e8dc', 100: '#e0d4c8', 200: '#d0c4b4',
    300: '#c0b0a0', 400: '#a09080', 500: '#8a7a6a',
    600: '#6b5b4e', 700: '#4d4038', 800: '#342a24',
    900: '#2d3436',
  },
  success: { 400: '#7dab7d', 500: '#6d9b6d' },
  danger: { 400: '#c47a7a', 500: '#b06a6a' },
  warning: { 400: '#e0b060', 500: '#d0a050' },
}

export const clay = {
  bg: '#f0e6d8',
  card: '#f5ebe0',
  inset: '#e8ddd0',
  shadow: '#d4c4b4',
  highlight: 'rgba(255,255,255,0.6)',
  text: '#2d3436',
  textMuted: '#8a7a6a',
}

export const cardStyle = {
  backgroundColor: clay.card,
  borderRadius: 24,
  borderWidth: 1,
  borderColor: clay.highlight,
  shadowColor: clay.shadow,
  shadowOffset: { width: 8, height: 8 },
  shadowOpacity: 0.45,
  shadowRadius: 16,
  elevation: 8,
}

export const insetStyle = {
  backgroundColor: clay.inset,
  borderRadius: 16,
  shadowColor: clay.shadow,
  shadowOffset: { width: -4, height: -4 },
  shadowOpacity: 0.5,
  shadowRadius: 8,
  elevation: 2,
}
