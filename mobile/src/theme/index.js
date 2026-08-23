/**
 * Flujo — tema mobile derivado del paquete compartido packages/design-tokens.
 * Mantiene la API previa (colors, clay, gradients, shadow) para no romper
 * las pantallas existentes, pero con la nueva identidad visual.
 */
import { colors as flow, flowPalette } from '@portal/design-tokens'

// Familias de fuente (requieren useFonts en App.js antes de renderizar)
export const fonts = {
  display: 'BricolageGrotesque_700Bold',
  displayMedium: 'BricolageGrotesque_600SemiBold',
  body: 'InstrumentSans_400Regular',
  bodyMedium: 'InstrumentSans_500Medium',
  bodySemiBold: 'InstrumentSans_600SemiBold',
  bodyBold: 'InstrumentSans_700Bold',
  mono: 'SplineSansMono_400Regular',
  monoMedium: 'SplineSansMono_500Medium',
  monoSemiBold: 'SplineSansMono_600SemiBold',
}

export { flowPalette }

// Escalas compatibles con el código existente, ahora en identidad Flujo
export const colors = {
  primary: {
    50: '#E3F1F1', 100: '#C9E4E5', 200: '#9DD0D3', 300: '#5FB8BC',
    400: '#35A0A6', 500: '#1B8A8F', 600: '#14666B', 700: '#104F53',
  },
  dark: {
    50: '#FBFAF7', 100: '#F1EDE3', 200: '#E4DFD1', 300: '#CFC7B2',
    400: '#A3B5B2', 500: '#6E8884', 600: '#55716D', 700: '#37544F',
    800: '#123332', 900: '#0E2928', 950: '#091E1D',
  },
  success: { 50: '#E8F4E5', 100: '#D3E8CD', 400: '#5FA052', 500: '#4A8541' },
  danger: { 50: '#FBEAE5', 100: '#F6D5CB', 400: '#EA7E63', 500: '#E86A4E' },
  warning: { 50: '#FAF0DE', 100: '#F4E1C0', 400: '#ECB05A', 500: '#E9A13B' },
  violet: { 50: '#EFECF9', 100: '#DED7F2', 400: '#8A7BC8', 500: '#7466B0' },
}

// Superficies papel/tinta
export const clay = {
  bg: flow.paper,
  card: flow.card,
  inset: flow.paperDeep,
  surface: flow.paperDeep,
  border: flow.mist,
  shadow: flow.ink,
  highlight: '#FFFFFF',
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
  brand: ['#22A0A6', '#14666B'],
  income: ['#22A0A6', '#5FB8BC'],
  expense: ['#ED7A5F', '#C24E36'],
  savings: ['#E9A13B', '#C07D22'],
  debt: ['#ED7A5F', '#F09A85'],
  report: ['#5B8BD0', '#8FB6E4'],
  calc: ['#E9A13B', '#F2C57E'],
  projection: ['#1B8A8F', '#5FB8BC'],
}

// Sombras cálidas sobre papel (formato RN)
const baseColor = 'rgba(18,51,50,1)'
export const shadow = {
  sm: { shadowColor: baseColor, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  md: { shadowColor: baseColor, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.10, shadowRadius: 16, elevation: 5 },
  lg: { shadowColor: baseColor, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.14, shadowRadius: 28, elevation: 10 },
  brand: { shadowColor: '#14666B', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.30, shadowRadius: 20, elevation: 8 },
}
