import { View, Text, Dimensions } from 'react-native'
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit'
import { clay, colors } from '../theme'

const SCREEN_W = Dimensions.get('window').width
// Ancho por defecto: pantalla menos padding de screen (16*2) y de ClayCard (18*2)
const DEFAULT_W = SCREEN_W - 68

// Abrevia montos grandes para las etiquetas del eje (1.2M, 350k).
export function abbreviate(n) {
  const v = Math.abs(Number(n) || 0)
  if (v >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${Math.round(n / 1_000)}k`
  return String(Math.round(n))
}

const hexToRgb = (hex) => {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function baseConfig(accentHex = colors.primary[500]) {
  const [r, g, b] = hexToRgb(accentHex)
  return {
    backgroundGradientFrom: clay.card,
    backgroundGradientTo: clay.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(${r}, ${g}, ${b}, ${opacity})`,
    labelColor: () => clay.textMuted,
    propsForDots: { r: '3.5', strokeWidth: '1', stroke: clay.card },
    propsForBackgroundLines: { stroke: clay.border, strokeDasharray: '' },
    barPercentage: 0.6,
  }
}

function ChartFrame({ title, children }) {
  return (
    <View>
      {title ? (
        <Text style={{ fontSize: 13, fontWeight: '800', color: clay.text, marginBottom: 10 }}>{title}</Text>
      ) : null}
      <View style={{ marginLeft: -8 }}>{children}</View>
    </View>
  )
}

// Línea (una o varias series). datasets: [{ data:[], color:hex }]
export function ClayLineChart({ title, labels, datasets, legend, height = 200, width = DEFAULT_W, formatY = abbreviate }) {
  const ds = datasets.map((d) => ({
    data: d.data,
    color: (opacity = 1) => {
      const [r, g, b] = hexToRgb(d.color || colors.primary[500])
      return `rgba(${r}, ${g}, ${b}, ${opacity})`
    },
    strokeWidth: 2,
  }))
  return (
    <ChartFrame title={title}>
      <LineChart
        data={{ labels, datasets: ds, legend }}
        width={width} height={height}
        chartConfig={baseConfig(datasets[0]?.color)}
        bezier fromZero withInnerLines
        formatYLabel={formatY}
        style={{ borderRadius: 12 }}
      />
    </ChartFrame>
  )
}

// Barras (una serie). accent controla el color.
export function ClayBarChart({ title, labels, data, accent = colors.primary[500], height = 210, width = DEFAULT_W, formatY = abbreviate }) {
  return (
    <ChartFrame title={title}>
      <BarChart
        data={{ labels, datasets: [{ data }] }}
        width={width} height={height}
        chartConfig={baseConfig(accent)}
        fromZero showValuesOnTopOfBars={false}
        formatYLabel={formatY}
        style={{ borderRadius: 12 }}
      />
    </ChartFrame>
  )
}

// Dona/pastel. slices: [{ name, value, color }]
export function ClayPieChart({ title, slices, height = 190, width = DEFAULT_W }) {
  const data = slices.map((s) => ({
    name: s.name,
    population: Math.max(0, Number(s.value) || 0),
    color: s.color,
    legendFontColor: clay.textMuted,
    legendFontSize: 12,
  }))
  return (
    <ChartFrame title={title}>
      <PieChart
        data={data}
        width={width} height={height}
        chartConfig={baseConfig()}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="8"
        absolute={false}
      />
    </ChartFrame>
  )
}
