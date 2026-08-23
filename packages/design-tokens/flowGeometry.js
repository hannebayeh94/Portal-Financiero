/**
 * Geometría del mapa de flujo — compartida entre web (SVG) y mobile (react-native-svg).
 * Dado un ingreso y sus corrientes de salida, calcula nodos, grosores y paths bezier.
 */

export function computeFlowLayout({ streams, income, width = 800, height = 340 }) {
  const sourceX = 84
  const targetX = width - 190
  const padTop = 46
  const usable = height - padTop * 2

  const clean = (streams || [])
    .map((s) => ({ ...s, value: Math.max(0, Number(s.value) || 0) }))
    .filter((s) => s.value > 0)

  const outflow = clean.reduce((acc, s) => acc + s.value, 0)
  const free = Math.max(0, Number(income) - outflow)

  const all = [...clean]
  if (free > 0 && Number(income) > 0) {
    all.push({ label: 'Libre', value: free, color: '#1B8A8F' })
  }

  const n = all.length || 1
  const rowH = usable / n
  const maxVal = Math.max(...all.map((s) => s.value), 1)

  const sourceY = height / 2

  const nodes = all.map((s, i) => {
    const cy = padTop + rowH * i + rowH / 2
    const thickness = Math.max(3, Math.min(30, (s.value / maxVal) * 26))
    const midX = sourceX + (targetX - sourceX) * 0.55
    return {
      label: s.label,
      value: s.value,
      color: s.color,
      ratio: Number(income) > 0 ? s.value / Number(income) : 0,
      thickness,
      startY: sourceY,
      endY: cy,
      path:
        `M ${sourceX} ${sourceY} ` +
        `C ${midX} ${sourceY}, ${midX} ${cy}, ${targetX} ${cy}`,
    }
  })

  return {
    width,
    height,
    source: { x: sourceX, y: sourceY },
    targetX,
    nodes,
    outflow,
    free,
  }
}
