/**
 * Flujo — sistema de diseño compartido Portal Financiero
 * Fuente única de verdad visual para web (React+Tailwind) y mobile (Expo).
 * Solo ESM puro, sin dependencias: consumible por Node, Vite y Metro.
 */

export const colors = {
  // Superficies
  paper: '#F6F3EC',
  paperDeep: '#EFEAE0',
  card: '#FFFFFF',
  mist: '#DDD6C6',
  mistSoft: '#E9E4D7',

  // Tinta
  ink: '#123332',
  inkSoft: '#3E5A57',
  inkMuted: '#6E8884',
  inkFaint: '#A3B5B2',

  // Acentos semánticos del flujo
  water: {
    light: '#5FB8BC',
    DEFAULT: '#1B8A8F',
    dark: '#14666B',
    tint: '#E3F1F1',
  },
  coral: {
    light: '#F09A85',
    DEFAULT: '#E86A4E',
    dark: '#C24E36',
    tint: '#FBEAE5',
  },
  amber: {
    light: '#F2C57E',
    DEFAULT: '#E9A13B',
    dark: '#C07D22',
    tint: '#FAF0DE',
  },
}

// Paleta categórica para corrientes del mapa y gráficas
export const flowPalette = [
  '#1B8A8F', // agua
  '#E86A4E', // coral
  '#E9A13B', // ámbar
  '#5B8BD0', // azul río
  '#8A7BC8', // lavanda
  '#5FA052', // verde ribera
]

export const fonts = {
  display: '"Bricolage Grotesque", "Instrument Sans", sans-serif',
  body: '"Instrument Sans", system-ui, -apple-system, sans-serif',
  mono: '"Spline Sans Mono", ui-monospace, monospace',
}

export const radius = {
  sm: '0.625rem',
  md: '1rem',
  lg: '1.5rem',
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
}

export const motion = {
  fast: 150,
  base: 200,
  slow: 400,
  ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
}

// Sombras cálidas sobre papel
export const shadows = {
  sm: '0 1px 2px rgba(18, 51, 50, 0.06), 0 4px 12px -6px rgba(18, 51, 50, 0.10)',
  md: '0 2px 4px rgba(18, 51, 50, 0.05), 0 12px 28px -12px rgba(18, 51, 50, 0.14)',
  lg: '0 4px 8px rgba(18, 51, 50, 0.05), 0 24px 48px -20px rgba(18, 51, 50, 0.20)',
}

const tokens = { colors, flowPalette, fonts, radius, spacing, motion, shadows }
export default tokens
