// Modern fintech (light) theme
export const colors = {
  primary: {
    50: '#EEEDFD', 100: '#DEDAFB', 200: '#C0B8F7', 300: '#A193F2',
    400: '#8B7CF0', 500: '#6D54E8', 600: '#5A41D6', 700: '#4835B0',
  },
  dark: {
    50: '#F4F5FB', 100: '#EAECF5', 200: '#DADDEC', 300: '#BCC0D6',
    400: '#9297B0', 500: '#6E7391', 600: '#4C5170', 700: '#343954',
    800: '#222642', 900: '#141726',
  },
  success: { 50: '#E7F8EF', 100: '#C8EFD9', 400: '#22C55E', 500: '#16A34A' },
  danger: { 50: '#FEECEF', 100: '#FBD5DC', 400: '#F43F5E', 500: '#E11D48' },
  warning: { 50: '#FEF3E2', 100: '#FCE3BC', 400: '#F59E0B', 500: '#D97706' },
  violet: { 50: '#F3EBFE', 100: '#E7D6FD', 400: '#A855F7', 500: '#9333EA' },
}

export const clay = {
  bg: '#F4F5FB',
  card: '#FFFFFF',
  inset: '#F1F2F9',
  surface: '#F1F2F9',
  border: '#E8EAF2',
  shadow: '#4C5170',
  highlight: '#FFFFFF',
  text: '#171A2B',
  textMuted: '#8A90A6',
  placeholder: '#AEB3C6',
}

// Two-stop gradients [start, end] for the SVG GradientCard
export const gradients = {
  brand: ['#6A5AF9', '#A85CF6'],
  income: ['#22C55E', '#4ADE80'],
  expense: ['#F43F5E', '#FB7185'],
  savings: ['#7C5CFC', '#A855F7'],
  debt: ['#F97316', '#FB923C'],
  report: ['#3B82F6', '#60A5FA'],
  calc: ['#F59E0B', '#FBBF24'],
  projection: ['#0EA5E9', '#38BDF8'],
}

// Soft modern drop shadows
export const shadow = {
  sm: { shadowColor: '#4C5170', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  md: { shadowColor: '#4C5170', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.10, shadowRadius: 16, elevation: 5 },
  lg: { shadowColor: '#4C5170', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.14, shadowRadius: 28, elevation: 10 },
  brand: { shadowColor: '#6A5AF9', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 8 },
}

export const cardStyle = {
  backgroundColor: clay.card,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: clay.border,
  ...shadow.md,
}

export const insetStyle = {
  backgroundColor: clay.inset,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: clay.border,
}
