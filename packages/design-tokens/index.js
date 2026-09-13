/**
 * Nocturno — sistema de diseño compartido Portal Financiero.
 * Identidad oscura fintech: superficies casi negras azuladas, un único acento
 * índigo eléctrico y verde menta para ganancias. Fuente de verdad visual para
 * web (React+Tailwind) y mobile (Expo). ESM puro, sin dependencias.
 */

export const colors = {
  // Superficies
  paper: '#0A0E15',       // fondo base
  paperDeep: '#070A10',   // fondo hundido
  card: '#10151F',        // panel
  panel: '#10151F',
  panelRaised: '#161D2A', // panel elevado / hover
  mist: '#1E2837',        // línea
  mistSoft: '#161D2A',

  // Tinta
  ink: '#E8EEF7',
  inkSoft: '#C2CCDA',
  inkMuted: '#8794A8',
  inkFaint: '#5A6879',

  // Acento principal: índigo eléctrico
  water: {
    light: '#8FA8FF',
    DEFAULT: '#6C8CFF',
    dark: '#4B6BE0',
    tint: 'rgba(108,140,255,0.14)',
  },
  // Negativo / pérdida: coral
  coral: {
    light: '#FF9A9A',
    DEFAULT: '#FF6B6B',
    dark: '#E04B4B',
    tint: 'rgba(255,107,107,0.14)',
  },
  // Advertencia / neutro cálido
  amber: {
    light: '#FFCE73',
    DEFAULT: '#F5B84B',
    dark: '#C8912F',
    tint: 'rgba(245,184,75,0.14)',
  },

  // Semánticos directos
  gain: '#37D399',
  loss: '#FF6B6B',
  warn: '#F5B84B',
}

// Paleta categórica para corrientes del mapa y gráficas (brillante sobre oscuro)
export const flowPalette = [
  '#6C8CFF', // índigo
  '#37D399', // menta
  '#F5B84B', // ámbar
  '#FF6B6B', // coral
  '#B98CFF', // violeta
  '#4FD8E8', // cian
]

export const fonts = {
  display: '"Sora", "Manrope", system-ui, sans-serif',
  body: '"Manrope", system-ui, -apple-system, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
}

export const radius = {
  sm: '0.5rem',
  md: '0.875rem',
  lg: '1.25rem',
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

// Sombras profundas sobre negro (con highlight interior sutil)
export const shadows = {
  sm: '0 1px 0 rgba(255,255,255,0.03), 0 6px 16px -10px rgba(0,0,0,0.7)',
  md: '0 12px 32px -20px rgba(0,0,0,0.85)',
  lg: '0 28px 64px -32px rgba(0,0,0,0.9)',
}

// Firma: gradiente "corriente" índigo → menta, usado con moderación.
export const signatureGradient = 'linear-gradient(135deg, #6C8CFF 0%, #37D399 100%)'

const tokens = { colors, flowPalette, fonts, radius, spacing, motion, shadows, signatureGradient }
export default tokens
