/**
 * Nocturno — tema mobile Portal Financiero.
 * Identidad oscura fintech derivada de packages/design-tokens. Mantiene la API
 * previa (colors, clay, gradients, shadow) para no romper las pantallas.
 */
import { colors as flow, flowPalette } from '@portal/design-tokens'

// Familias de fuente (requieren useFonts en App.js antes de renderizar)
export const fonts = {
  display: 'Sora_700Bold',
  displayMedium: 'Sora_600SemiBold',
  body: 'Manrope_400Regular',
  bodyMedium: 'Manrope_500Medium',
  bodySemiBold: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
  monoSemiBold: 'JetBrainsMono_600SemiBold',
}

export { flowPalette }

// Escalas compatibles con el código existente, ahora en identidad Nocturna.
export const colors = {
  primary: {
    50: '#12182B', 100: '#182146', 200: '#233066', 300: '#33478F',
    400: '#4E6AD6', 500: '#6C8CFF', 600: '#8FA8FF', 700: '#B3C4FF',
  },
  dark: {
    50: '#10151F', 100: '#161D2A', 200: '#1E2837', 300: '#2A3648',
    400: '#465468', 500: '#6B7A8F', 600: '#8794A8', 700: '#A7B3C4',
    800: '#C2CCDA', 900: '#E8EEF7', 950: '#F5F8FC',
  },
  success: { 50: '#0D2A22', 100: '#123A2E', 400: '#2FB488', 500: '#37D399', 600: '#5FE0B0' },
  danger: { 50: '#2A1416', 100: '#3A1B1E', 400: '#E05555', 500: '#FF6B6B', 600: '#FF8A8A' },
  warning: { 50: '#2A2010', 100: '#3A2C14', 400: '#D9A23E', 500: '#F5B84B', 600: '#FFCE73' },
  violet: { 50: '#1D1633', 100: '#2A2150', 400: '#B98CFF', 500: '#9F76F0' },
}

// Superficies oscuras
export const clay = {
  bg: flow.paper,
  card: flow.card,
  inset: flow.paperDeep,
  surface: flow.paperDeep,
  border: flow.mist,
  shadow: '#000000',
  highlight: flow.panelRaised,
  text: flow.ink,
  textMuted: flow.inkMuted,
  placeholder: flow.inkFaint,
}

export const accent = {
  water: flow.water.DEFAULT,
  waterDark: flow.water.dark,
  coral: flow.coral.DEFAULT,
  coralDark: flow.coral.dark,
  amber: flow.amber.DEFAULT,
  amberDark: flow.amber.dark,
}

export const gradients = {
  brand: ['#6C8CFF', '#37D399'],
  income: ['#37D399', '#5FE0B0'],
  expense: ['#FF6B6B', '#E04B4B'],
  savings: ['#F5B84B', '#C8912F'],
  debt: ['#FF6B6B', '#FF8A8A'],
  report: ['#6C8CFF', '#8FA8FF'],
  calc: ['#B98CFF', '#6C8CFF'],
  projection: ['#4FD8E8', '#6C8CFF'],
}

// Sombras profundas sobre negro (formato RN)
const baseColor = 'rgba(0,0,0,1)'
export const shadow = {
  sm: { shadowColor: baseColor, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 3 },
  md: { shadowColor: baseColor, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 6 },
  lg: { shadowColor: baseColor, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.6, shadowRadius: 28, elevation: 10 },
  brand: { shadowColor: '#6C8CFF', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 8 },
}
